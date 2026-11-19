/**
 * OAuth 2.1 authorization server for remote MCP clients (claude.ai connectors and the like).
 *
 * The flow, as MCP specifies it: the client registers itself dynamically, sends the user to
 * `/authorize`, which shows our login page; the password is checked by Bookkeeper's
 * `/auth/connector`, which returns a long-lived bookkeeping refresh token for that user. We hand
 * the client a one-time code, which it exchanges (with PKCE) for our own access and refresh
 * tokens. Both are sealed payloads carrying the user's Bookkeeper token, so every MCP request
 * runs with exactly that user's rights, and nothing but registered clients is stored.
 *
 * Tokens cannot be revoked one by one: an access token lives an hour, and a refresh token no
 * longer than the Bookkeeper token inside it (`CONNECTOR_TOKEN_DAYS` on the API, 30 by default).
 * A disabled user is refused by Bookkeeper at the next hourly refresh. Changing `MCP_SECRET`
 * invalidates every token at once.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes, randomUUID } from 'node:crypto'
import { Request, Response } from 'express'
import { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js'
import { AuthorizationParams, OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js'
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import { InvalidGrantError, InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js'
import { OAuthClientInformationFull, OAuthTokens } from '@modelcontextprotocol/sdk/shared/auth.js'
import { Sealer } from './seal'
import { loginPage, messagePage } from './pages'

const SCOPE = 'bookkeeping'
const ACCESS_TTL = 60 * 60
const PENDING_TTL = 10 * 60 * 1000
const CODE_TTL = 60 * 1000
const MAX_LOGIN_ATTEMPTS = 5
const MAX_CLIENTS = 1000

interface TokenPayload {
  t: 'a' | 'r'
  cid: string
  owner: string
  bk: string
  exp: number
  res: string
}

interface Pending {
  client: OAuthClientInformationFull
  params: AuthorizationParams
  expires: number
  attempts: number
}

interface Code {
  clientId: string
  codeChallenge: string
  redirectUri: string
  owner: string
  bk: string
  bkExpires: number
  expires: number
}

/**
 * Registered clients in one JSON file. Registration is rare and the list is small.
 */
export class FileClientsStore implements OAuthRegisteredClientsStore {
  private file: string
  private clients: Map<string, OAuthClientInformationFull>

  constructor (dataDir: string) {
    fs.mkdirSync(dataDir, { recursive: true })
    this.file = path.join(dataDir, 'clients.json')
    const list: OAuthClientInformationFull[] = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : []
    this.clients = new Map(list.map(c => [c.client_id, c]))
  }

  getClient (clientId: string): OAuthClientInformationFull | undefined {
    return this.clients.get(clientId)
  }

  registerClient (client: Omit<OAuthClientInformationFull, 'client_id' | 'client_id_issued_at'>): OAuthClientInformationFull {
    const full: OAuthClientInformationFull = { ...client, client_id: randomUUID(), client_id_issued_at: Math.floor(Date.now() / 1000) }
    this.clients.set(full.client_id, full)
    // Registration is open by the protocol's design, so bound the file: drop the oldest.
    while (this.clients.size > MAX_CLIENTS) {
      this.clients.delete(this.clients.keys().next().value as string)
    }
    const tmp = `${this.file}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(Array.from(this.clients.values()), null, 2), { mode: 0o600 })
    fs.renameSync(tmp, this.file)
    return full
  }
}

export interface ProviderConfig {
  apiUrl: string
  secret: string
  dataDir: string
  // The MCP endpoint URL, which tokens are bound to.
  resource: URL
}

export class TasenorOAuthProvider implements OAuthServerProvider {
  readonly clientsStore: FileClientsStore
  private sealer: Sealer
  private apiUrl: string
  private resource: string
  private pending = new Map<string, Pending>()
  private codes = new Map<string, Code>()

  constructor (config: ProviderConfig) {
    this.clientsStore = new FileClientsStore(config.dataDir)
    this.sealer = new Sealer(config.secret)
    this.apiUrl = config.apiUrl.replace(/\/+$/, '')
    this.resource = config.resource.href
  }

  /**
   * Show the login page. The authorization request waits server-side under a random id, so the
   * form carries nothing a user could tamper with.
   */
  async authorize (client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    this.expire()
    const id = randomBytes(24).toString('base64url')
    this.pending.set(id, { client, params, expires: Date.now() + PENDING_TTL, attempts: 0 })
    this.sendLogin(res, id, this.pending.get(id) as Pending)
  }

  private sendLogin (res: Response, id: string, pending: Pending, error?: string, user?: string): void {
    // Browsers apply form-action to the redirect that follows a submit too, so the client's
    // redirect target must be allowed, or the browser silently stops after a successful login.
    const target = new URL(pending.params.redirectUri)
    const back = target.protocol === 'http:' || target.protocol === 'https:' ? target.origin : target.protocol
    res.setHeader('Content-Security-Policy', `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${back}; frame-ancestors 'none'`)
    res.setHeader('Cache-Control', 'no-store')
    res.status(error ? 401 : 200).type('html').send(loginPage({
      request: id,
      clientName: pending.client.client_name || 'An unnamed application',
      redirectHost: new URL(pending.params.redirectUri).host,
      error,
      user
    }))
  }

  /**
   * Handle the login form: check the password with Bookkeeper and send the user back to the
   * client with a one-time code.
   */
  async login (req: Request, res: Response): Promise<void> {
    this.expire()
    const { request, user, password, action } = (req.body || {}) as Record<string, string>
    const pending = typeof request === 'string' ? this.pending.get(request) : undefined
    if (!pending) {
      res.status(400).type('html').send(messagePage('This login link has expired. Start again from your application.'))
      return
    }
    const back = new URL(pending.params.redirectUri)
    if (pending.params.state !== undefined) {
      back.searchParams.set('state', pending.params.state)
    }
    if (action === 'deny') {
      this.pending.delete(request)
      back.searchParams.set('error', 'access_denied')
      res.redirect(302, back.href)
      return
    }
    if (typeof user !== 'string' || typeof password !== 'string' || !user || !password) {
      this.sendLogin(res, request, pending, 'Give your email and password.', user)
      return
    }
    const resp = await fetch(`${this.apiUrl}/auth/connector`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ user, password })
    })
    if (!resp.ok) {
      pending.attempts++
      if (pending.attempts >= MAX_LOGIN_ATTEMPTS) {
        this.pending.delete(request)
        res.status(401).type('html').send(messagePage('Too many failed attempts. Start again from your application.'))
        return
      }
      this.sendLogin(res, request, pending, resp.status === 401 ? 'Wrong email or password.' : `Login failed (${resp.status}).`, user)
      return
    }
    const { refresh, expires } = await resp.json() as { refresh: string, expires: number }
    this.pending.delete(request)
    const code = randomBytes(32).toString('base64url')
    this.codes.set(code, {
      clientId: pending.client.client_id,
      codeChallenge: pending.params.codeChallenge,
      redirectUri: pending.params.redirectUri,
      owner: user,
      bk: refresh,
      bkExpires: expires,
      expires: Date.now() + CODE_TTL
    })
    back.searchParams.set('code', code)
    res.redirect(302, back.href)
  }

  async challengeForAuthorizationCode (client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    const code = this.codes.get(authorizationCode)
    if (!code || code.clientId !== client.client_id || code.expires < Date.now()) {
      throw new InvalidGrantError('Invalid or expired authorization code.')
    }
    return code.codeChallenge
  }

  async exchangeAuthorizationCode (client: OAuthClientInformationFull, authorizationCode: string, _codeVerifier?: string, redirectUri?: string): Promise<OAuthTokens> {
    const code = this.codes.get(authorizationCode)
    // Codes are single-use whatever happens next.
    this.codes.delete(authorizationCode)
    if (!code || code.clientId !== client.client_id || code.expires < Date.now()) {
      throw new InvalidGrantError('Invalid or expired authorization code.')
    }
    if (redirectUri !== undefined && redirectUri !== code.redirectUri) {
      throw new InvalidGrantError('redirect_uri does not match the authorization request.')
    }
    return this.issue(client.client_id, code.owner, code.bk, code.bkExpires)
  }

  async exchangeRefreshToken (client: OAuthClientInformationFull, refreshToken: string): Promise<OAuthTokens> {
    const payload = this.sealer.open<TokenPayload>(refreshToken)
    if (!payload || payload.t !== 'r' || payload.cid !== client.client_id || payload.res !== this.resource) {
      throw new InvalidGrantError('Invalid refresh token.')
    }
    if (payload.exp < now()) {
      throw new InvalidGrantError('Refresh token has expired. Log in again.')
    }
    return this.issue(payload.cid, payload.owner, payload.bk, payload.exp, refreshToken)
  }

  async verifyAccessToken (token: string): Promise<AuthInfo> {
    const payload = this.sealer.open<TokenPayload>(token)
    if (!payload || payload.t !== 'a' || payload.res !== this.resource) {
      throw new InvalidTokenError('Invalid access token.')
    }
    if (payload.exp < now()) {
      throw new InvalidTokenError('Access token has expired.')
    }
    return {
      token,
      clientId: payload.cid,
      scopes: [SCOPE],
      expiresAt: payload.exp,
      resource: new URL(payload.res),
      extra: { owner: payload.owner, bookkeeperToken: payload.bk }
    }
  }

  private issue (cid: string, owner: string, bk: string, bkExpires: number, refreshToken?: string): OAuthTokens {
    const exp = Math.min(now() + ACCESS_TTL, bkExpires)
    const base = { cid, owner, bk, res: this.resource }
    return {
      access_token: this.sealer.seal({ ...base, t: 'a', exp }),
      token_type: 'Bearer',
      expires_in: exp - now(),
      refresh_token: refreshToken || this.sealer.seal({ ...base, t: 'r', exp: bkExpires }),
      scope: SCOPE
    }
  }

  private expire (): void {
    const t = Date.now()
    for (const [id, p] of this.pending) if (p.expires < t) this.pending.delete(id)
    for (const [id, c] of this.codes) if (c.expires < t) this.codes.delete(id)
  }
}

function now (): number {
  return Math.floor(Date.now() / 1000)
}
