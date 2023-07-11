import { error, TokenPayload, Secret, TokenAudience, Token, RefreshTokenPayload, TokenPair, NormalTokenPayload, REFRESH_TOKEN_EXPIRY_TIME, TOKEN_EXPIRY_TIME, TOKEN_ISSUER } from '@dataplug/tasenor-common'
import jwt from 'jsonwebtoken'
import { create } from 'ts-opaque'
import { vault } from './vault'

/**
 * Find a token from the request if available.
 * @param request A HTTP request.
 */
function get(request): Token | undefined {
  let token
  if (request.query && request.query.token) {
    token = request.query.token
  } else if (request.headers.authorization && /^Bearer /.test(request.headers.authorization)) {
    token = request.headers.authorization.substr(7)
  }
  return token
}

/**
 * Sign the payload with the given secret.
 * @param payload
 * @param expires
 * @returns A JSON web token.
 */
async function sign(payload: TokenPayload, audience: TokenAudience, expires: number = 0): Promise<Token> {
  const secret = audience === 'refresh' ? await vault.get('SECRET') as Secret : vault.getPrivateSecret()
  if (!secret) {
    throw new Error('Cannot fins secret to sign token.')
  }
  if (!expires) {
    expires = audience === 'refresh' ? REFRESH_TOKEN_EXPIRY_TIME : TOKEN_EXPIRY_TIME
  }
  const options = {
    audience,
    expiresIn: expires,
    issuer: TOKEN_ISSUER
  }

  const token = create(jwt.sign({ data: payload }, secret, options)) as Token
  return token
}

/**
 * Sign both the normal token and refresh token for it.
 * @param payload
 * @param audience
 * @param expires
 */
async function sign2(payload: TokenPayload, audience: TokenAudience, expires: number = 0): Promise<TokenPair> {
  const token = await sign(payload, audience, expires)
  const refresh = await sign({ audience, owner: payload.owner, feats: payload.feats, plugins: payload.plugins }, 'refresh', expires * 2)
  return { token, refresh }
}

/**
 * Check the token validity.
 * @param token
 * @param secret
 * @param quiet If set, do not trigger errors.
 * @returns Token payload if valid.
 */
function verify(token: Token, secret: Secret, audience: TokenAudience | TokenAudience[], quiet: boolean = false): TokenPayload | null {
  if (!secret) throw new Error('Cannot verify token since no secret given.')
  if (!audience) throw new Error('Cannot verify token since no audience given.')

  function fail(msg: string): void {
    if (!quiet) error(msg)
  }

  try {
    const decoded: jwt.JwtPayload = jwt.verify(token, secret, { audience, issuer: [TOKEN_ISSUER] }) as jwt.JwtPayload
    if (!decoded) {
      fail('Cannot decode the token.')
    } else if (!decoded.data) {
      fail(`Cannot find any payload from the token ${token}.`)
    } else {
      if (!decoded.exp) {
        fail(`Token content ${decoded} does not have exp-field.`)
        return null
      }
      if (decoded.data.audience) {
        const data = decoded.data as RefreshTokenPayload
        if (!data.owner || !data.feats) {
          fail(`Cannot find proper payload from the refresh token with content ${JSON.stringify(decoded)}.`)
          return null
        } else {
          return data
        }
      } else {
        const data = decoded.data as NormalTokenPayload
        if (!data.owner || !data.feats) {
          fail(`Cannot find proper payload from the token with content ${JSON.stringify(decoded)}.`)
          return null
        } else {
          return data
        }
      }
    }
  } catch (err) {
    fail(`Token verification failed ${err} for ${JSON.stringify(parse(token))}`)
  }
  return null
}

/**
 * Parse the payload of the token without verifying.
 * @param token
 */
function parse(token: Token): { [key: string]: any; } | null {
  const decoded = jwt.decode(token, { json: true, complete: true })
  return decoded
}

/**
 * A checker for token validity.
 * @param token
 * @param audience
 * @param quiet If set, do not trigger errors.
 */
async function check(token: Token, audience: TokenAudience, quiet: boolean = false): Promise<boolean> {
  if (!token) {
    return false
  }
  const secret = audience === 'refresh' ? await vault.get('SECRET') as Secret : vault.getPrivateSecret()
  if (!secret) {
    return false
  }
  const payload = tokens.verify(token as Token, secret, audience, quiet)
  return !!payload
}

export const tokens = {
  check,
  get,
  parse,
  sign,
  sign2,
  verify
}
