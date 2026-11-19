/**
 * Tasenor Bookkeeper MCP server over Streamable HTTP, with its own OAuth 2.1 authorization
 * server, for remote clients such as claude.ai connectors.
 *
 * Configuration is by environment:
 * - `MCP_PUBLIC_URL` the public base URL of this server, e.g. `https://mcp.tasenor.com`. The
 *   OAuth metadata lives at its root, so give this server a host of its own rather than a path.
 * - `MCP_SECRET` at least 32 characters; seals every token. Changing it logs everyone out.
 * - `MCP_DATA_DIR` where registered clients are kept (default `./data`).
 * - `TASENOR_API` the Bookkeeper API base URL as seen from here (default `http://localhost:7205`).
 * - `PORT` (default 7206), `TASENOR_MCP_READ_ONLY` as for stdio.
 */
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { mcpAuthRouter, getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/server/auth/router.js'
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { BookkeeperApi } from './api'
import { createMcpServer } from './mcp'
import { TasenorOAuthProvider } from './oauth'
import pkg from '../package.json'

export function createApp (config: { publicUrl: string, secret: string, dataDir: string, apiUrl: string, readOnly?: boolean }): express.Express {
  const base = new URL(config.publicUrl)
  const resource = new URL('/mcp', base)
  const provider = new TasenorOAuthProvider({ apiUrl: config.apiUrl, secret: config.secret, dataDir: config.dataDir, resource })

  // One API client per user token, so access tokens are reused between requests.
  const apis = new Map<string, BookkeeperApi>()
  function apiFor (bookkeeperToken: string): BookkeeperApi {
    let api = apis.get(bookkeeperToken)
    if (!api) {
      if (apis.size >= 500) {
        apis.delete(apis.keys().next().value as string)
      }
      api = new BookkeeperApi({ url: config.apiUrl, refreshToken: bookkeeperToken })
      apis.set(bookkeeperToken, api)
    }
    return api
  }

  const app = express()
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.get('/health', (_req, res) => {
    res.send({ ok: true, version: pkg.version })
  })

  app.use(mcpAuthRouter({
    provider,
    issuerUrl: base,
    resourceServerUrl: resource,
    resourceName: 'Tasenor Bookkeeper',
    scopesSupported: ['bookkeeping']
  }))

  app.post('/login',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false }),
    express.urlencoded({ extended: false, limit: '10kb' }),
    (req, res, next) => {
      provider.login(req, res).catch(next)
    })

  const bearer = requireBearerAuth({
    verifier: provider,
    requiredScopes: ['bookkeeping'],
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(resource)
  })

  // Stateless: a fresh server and transport per request, bound to the caller's own token.
  app.post('/mcp', bearer, express.json({ limit: '1mb' }), async (req, res, next) => {
    try {
      const auth = req.auth
      const bookkeeperToken = auth?.extra?.bookkeeperToken
      if (typeof bookkeeperToken !== 'string') {
        res.status(401).send({ error: 'invalid_token' })
        return
      }
      const client = await provider.clientsStore.getClient(auth!.clientId)
      const server = createMcpServer(apiFor(bookkeeperToken), {
        readOnly: config.readOnly,
        source: `mcp: ${client?.client_name || auth!.clientId}`
      })
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
      res.on('close', () => {
        transport.close().catch(() => undefined)
        server.close().catch(() => undefined)
      })
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (err) {
      next(err)
    }
  })

  // Without sessions there is no server-initiated stream to GET and nothing to DELETE.
  app.all('/mcp', (_req, res) => {
    res.status(405).set('Allow', 'POST').send({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null })
  })

  return app
}

function main (): void {
  const publicUrl = process.env.MCP_PUBLIC_URL
  const secret = process.env.MCP_SECRET
  if (!publicUrl || !secret) {
    console.error('tasenor-mcp-http: MCP_PUBLIC_URL and MCP_SECRET must be set.')
    process.exit(1)
  }
  const app = createApp({
    publicUrl,
    secret,
    dataDir: process.env.MCP_DATA_DIR || 'data',
    apiUrl: process.env.TASENOR_API || 'http://localhost:7205',
    readOnly: !!process.env.TASENOR_MCP_READ_ONLY
  })
  const port = parseInt(process.env.PORT || '7206')
  app.listen(port, () => {
    console.log(`Tasenor MCP server ${pkg.version} on port ${port}, public URL ${publicUrl}`)
  })
}

if (require.main === module) {
  main()
}
