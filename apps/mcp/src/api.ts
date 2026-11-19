/**
 * A minimal client for the Bookkeeper REST API.
 *
 * The MCP server never touches the database itself: everything goes through the API with the
 * user's own token, so per-user database access, plugin subscriptions and period locks are
 * enforced exactly as they are for the UI.
 */

export interface ApiConfig {
  url: string
  // A long-lived refresh token, as made by `apps/cli/bin/token-sign.mjs refresh <email> bookkeeping`.
  refreshToken?: string
  // Alternatively, ordinary login credentials.
  user?: string
  password?: string
}

export class ApiError extends Error {
  status: number

  constructor (status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface TokenPair {
  token: string
  refresh: string
}

export class BookkeeperApi {
  private config: ApiConfig
  private token: string | null = null
  private refresh: string | null

  constructor (config: ApiConfig) {
    if (!config.refreshToken && !(config.user && config.password)) {
      throw new Error('Either TASENOR_REFRESH_TOKEN or both TASENOR_USERNAME and TASENOR_PASSWORD must be set.')
    }
    this.config = { ...config, url: config.url.replace(/\/+$/, '') }
    this.refresh = config.refreshToken || null
  }

  /**
   * Make a GET request, authenticating first if needed and once more if the token has expired.
   */
  async get<T = unknown> (path: string, query: Record<string, string | boolean | undefined> = {}): Promise<T> {
    return this.request<T>('GET', path, query)
  }

  async post<T = unknown> (path: string, body: unknown = {}): Promise<T> {
    return this.request<T>('POST', path, {}, body)
  }

  async delete (path: string): Promise<void> {
    await this.request('DELETE', path)
  }

  private async request<T> (method: string, path: string, query: Record<string, string | boolean | undefined> = {}, body?: unknown): Promise<T> {
    if (!this.token) {
      await this.authenticate()
    }
    let resp = await this.fetch(method, path, query, body)
    if (resp.status === 401 || resp.status === 403) {
      this.token = null
      await this.authenticate()
      resp = await this.fetch(method, path, query, body)
    }
    const text = await resp.text()
    if (!resp.ok) {
      let message = text
      try {
        message = JSON.parse(text).message || text
      } catch {
        // Not JSON, keep the raw text.
      }
      throw new ApiError(resp.status, `${resp.status} ${message}`.trim())
    }
    return (text ? JSON.parse(text) : null) as T
  }

  private async fetch (method: string, path: string, query: Record<string, string | boolean | undefined>, body?: unknown): Promise<Response> {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value === true) {
        params.set(key, 'true')
      } else if (value !== undefined && value !== false) {
        params.set(key, value)
      }
    }
    const qs = params.toString()
    const headers: Record<string, string> = { Authorization: `Bearer ${this.token}`, Accept: 'application/json' }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }
    return fetch(`${this.config.url}${path}${qs ? '?' + qs : ''}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  }

  /**
   * Get a fresh access token: by the refresh token if we have one, otherwise by logging in.
   * A password login also yields a refresh token (12h), which is used until it expires.
   */
  private async authenticate (): Promise<void> {
    if (this.refresh) {
      const resp = await fetch(`${this.config.url}/auth/refresh`, {
        headers: { Authorization: `Bearer ${this.refresh}`, Accept: 'application/json' }
      })
      if (resp.ok) {
        const pair = await resp.json() as TokenPair
        this.token = pair.token
        // A long-lived configured token is kept; a login session's token rolls over.
        if (!this.config.refreshToken) {
          this.refresh = pair.refresh
        }
        return
      }
      if (this.config.refreshToken) {
        throw new ApiError(resp.status, `Refreshing the Tasenor token failed with status ${resp.status}. Is TASENOR_REFRESH_TOKEN valid for ${this.config.url}?`)
      }
      this.refresh = null
    }
    const resp = await fetch(`${this.config.url}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ user: this.config.user, password: this.config.password })
    })
    if (!resp.ok) {
      throw new ApiError(resp.status, `Logging in to Tasenor as ${this.config.user} failed with status ${resp.status}.`)
    }
    const pair = await resp.json() as TokenPair
    this.token = pair.token
    this.refresh = pair.refresh
  }
}
