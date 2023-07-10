/**
 * Type definitions related to networking.
 *
 * @module tasenor-common/src/types/net
 */
import { MINUTES } from './time'
import Opaque from 'ts-opaque'
import { PluginCode } from './plugins'

// Net
// ---
export type Hostname = Opaque<string, 'Hostname'>

export type Url = Opaque<string, 'Url'>
export function isUrl(s: unknown): s is Url {
  return typeof s === 'string' && /^\w+:/.test(s)
}
export type LocalUrl = Opaque<string, 'LocalUrl'>
export function isLocalUrl(s: unknown): s is LocalUrl {
  return typeof s === 'string' && !/^\w+:/.test(s)
}

// Access token handling
// ---------------------


// Default expiry time for token.
export const TOKEN_EXPIRY_TIME = 30 * MINUTES
// Default expiry time for refresh.
export const REFRESH_TOKEN_EXPIRY_TIME = TOKEN_EXPIRY_TIME + 10 * MINUTES
// Name of the token issuer.
export const TOKEN_ISSUER = 'Tasenor'

/**
 * Intented audience of the security token.
 * * `refresh` - Can only be used for refreshing another token.
 * * `sites` - Can be used when a boookkeeper site comminicates to ERP.
 *
 * * `erp` - Communication from Bookkeeper to the ERP system by registered site backend.
 * * `ui` - Communication from Bookkeeper to the ERP system by UI server.
 * * `bookkeeping` - Communication from Bookkeeper UI to backend by logged in user.
 * * `plugins` - A token used by plugin publishers.
 */
export type TokenAudience = 'refresh' | 'erp' | 'ui' | 'sites' | 'bookkeeping' | 'plugins' | 'internal'
/**
 * An encoded token string.
 */
export type Token = Opaque<string, 'Token'>
/**
 * A secret used for signing.
 */
export type Secret = Opaque<string, 'Secret'>
/**
 * Feature flags for tokens.
 */
export type TokenFeats = {
  ADMIN?: boolean
  SUPERUSER?: boolean
}
/**
 * Names of the token features.
 */
export type TokenFeatName = keyof TokenFeats
/**
 * Payload for the token.
 */
export interface NormalTokenPayload {
  owner: string
  feats: TokenFeats
  plugins?: PluginCode[]
}
/**
 * Payload for the refresh token.
 */
 export interface RefreshTokenPayload {
  owner: string
  feats: TokenFeats
  plugins: PluginCode[]
  audience: TokenAudience
}
/**
 * Any token payload.
 */
export type TokenPayload = RefreshTokenPayload | NormalTokenPayload
/**
 * A pair containig both token and refresh token for it.
 */
export type TokenPair = {
  refresh: Token,
  token: Token
}
