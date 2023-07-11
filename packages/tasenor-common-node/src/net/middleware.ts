import cors from 'cors'
import express, { Request, Response, RequestHandler, ErrorRequestHandler } from 'express'
import { error, log, MAX_UPLOAD_SIZE, Secret, Token, TokenAudience, Url } from '@dataplug/tasenor-common'
import { tokens } from './tokens'
import { vault } from './vault'
import helmet from 'helmet'

/**
 * Hide tokens from URL.
 * @param url
 */
export function cleanUrl(url: string): string {
  return url.replace(/\btoken=[^&]+\b/, 'token=xxxx')
}

/**
 * A parameter definition to the initial middleware stack.
 */
export interface InitialMiddlewareStackDefinition {
  origin: Url | '*',
  api?: Url
}

/**
 * Construct standard initial part of stack of commonly shared middlewares.
 */
export function tasenorInitialStack(args: InitialMiddlewareStackDefinition): RequestHandler[] {
  const stack : RequestHandler[] = []

  // Add logger.
  stack.push((req: Request, res: Response, next: Function) => {
    if (req.method !== 'OPTIONS') {
      let owner
      const token = tokens.get(req)
      if (token) {
        const payload = tokens.parse(token)
        if (payload && payload.payload && payload.payload.data) {
          owner = payload.payload.data.owner
          let aud = payload.payload.aud
          if (payload.payload.aud === 'refresh') {
            aud = payload.payload.data.audience
          }
          switch (aud) {
            case 'sites':
              owner = `Site ${owner}`
              break
            case 'bookkeeping':
              owner = `User ${owner}`
              break
          }
        }
      }
      const user = owner ? `${owner} from ${req.ip}` : `${req.ip}`
      const message = `${user} ${req.method} ${req.hostname} ${cleanUrl(req.originalUrl)}`
      log(message)
    }
    next()
  })

  // Add cors.
  stack.push(cors({ origin: args.origin }))

  // Add helmet.
  let contentSecurityPolicy
  if (args.api) {
    const apiOrigin = new URL(args.api).origin
    contentSecurityPolicy = {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", apiOrigin],
        imgSrc: ["'self'", 'data:', apiOrigin],
        scriptSrc: ["'self'", "'unsafe-eval'"]
      }
    }
  } else {
    contentSecurityPolicy = false
  }
  stack.push(helmet({
    contentSecurityPolicy
  }))

  return stack
}

/**
 * Construct standard final part of stack of commonly shared middlewares.
 */
export function tasenorFinalStack(): (ErrorRequestHandler | RequestHandler)[] {
  const stack : (ErrorRequestHandler | RequestHandler)[] = []

  // Add error catcher.
  stack.push((err: Error, req: Request, res: Response, next: Function) => {
    error('Internal error:', err)
    if (res.headersSent) {
      return next(err)
    }
    res.status(500).send({ message: 'Internal server error.' })
    const message = `${req.ip} ${req.method} ${req.hostname} ${cleanUrl(req.originalUrl)} => ${res.statusCode}`
    error(message)
  })

  return stack
}

/**
 * A parameter defintion for construcing standard middleware stack.
 */
export interface MiddlewareStackDefinition {
  url?: boolean,
  json?: boolean,
  user?: boolean,
  admin?: boolean,
  superuser?: boolean,
  token?: boolean,
  uuid?: boolean,
  audience?: TokenAudience | TokenAudience[],
  upload?: boolean
}

/**
 * A constructor for tasenor middleware stack based on the arguments.
 *
 * Each flag adds one or more functions to the stack returned.
 *
 * Flags:
 * - `url` Urlenconder parser.
 * - `json` JSON body parser.
 * - `token` Look for token from the request, but do not verify it yet.
 * - `user` Check that user token is present and for bookkeeper.
 * - `uuid` Check that UUID header is present and parse owner from the token. Verify signature of the token for ANY audience.
 * - `admin` Check that the valid bookkeeper user token exists and has admin feat.
 * - `superuser` Check that the valid bookkeeper user token exists and has superuser feat.
 * - `audience` The token audience to check token against (user or admin implies 'bookkeeper' unless explicitly given).
 * - `upload` If set, allow much bigger body for request.
 *
 * The output on the res.locals is:
 *
 * - `token` Raw token string.
 * - `auth` Content of the token if verified.
 * - `user` Name of the owner of the token if verified,
 * - `uuid` If X-UUID header was found, the value of it.
 * - `owner` Set when UUID is found and token signed for ANY audience.
 */
export function tasenorStack({ url, json, user, uuid, admin, superuser, audience, token, upload }: MiddlewareStackDefinition): RequestHandler[] {
  const stack: RequestHandler[] = []

  // Set automatic up implications.
  if (superuser) {
    admin = true
  }
  if (admin) {
    user = true
  }
  if (user && !audience) {
    audience = 'bookkeeping'
  }
  if (audience) {
    token = true
  }
  if (uuid) {
    token = true
  }

  // Add some space for upload.
  const params: Record<string, unknown> = {}
  if (upload) {
    params.limit = MAX_UPLOAD_SIZE
  }

  // Add URL encoding middleware.
  if (url || (upload && !url && !json)) {
    stack.push(express.urlencoded({ extended: true, ...params }))
  }

  // Add JSON middleware.
  if (json) {
    stack.push(express.json({ ...params }))
  }

  // Find the token.
  if (token) {
    stack.push(async (req: Request, res: Response, next: Function) => {
      res.locals.token = tokens.get(req)
      next()
    })
  }

  // Set the UUID and owner.
  if (uuid) {
    stack.push(async (req: Request, res: Response, next: Function) => {
      if (!res.locals.token) {
        error('There is no token in the request and we are looking for UUID.')
        return res.status(403).send({ message: 'Forbidden.' })
      }
      const uuid = req.headers['x-uuid']
      if (!uuid) {
        error('Cannot find UUID from the request.')
        return res.status(403).send({ message: 'Forbidden.' })
      }
      const payload = tokens.parse(res.locals.token)
      if (!payload) {
        error(`Cannot parse payload from the token ${res.locals.token}`)
        return res.status(403).send({ message: 'Forbidden.' })
      }
      const audience = payload.payload.aud
      const secret = vault.getPrivateSecret()
      const ok = tokens.verify(res.locals.token, secret, audience)
      if (!ok) {
        error(`Failed to verify token ${res.locals.token} for audience ${audience}.`)
        return res.status(403).send({ message: 'Forbidden.' })
      }
      res.locals.uuid = uuid
      res.locals.owner = ok.owner
      next()
    })
  }

  // Add token check middleware.
  if (audience) {
    stack.push(async (req: Request, res: Response, next: Function) => {
      const token: Token = res.locals.token
      if (!token) {
        error(`Request ${req.method} ${cleanUrl(req.originalUrl)} from ${req.ip} has no token.`)
        res.status(401).send({ message: 'Unauthorized.' })
        return
      }
      const secret: Secret = audience === 'refresh' ? await vault.get('SECRET') as Secret : vault.getPrivateSecret()
      if (!secret) {
        error('Cannot find SECRET.')
        return res.status(500).send({ message: 'Unable to handle authorized requests at the moment.' })
      }
      if (!audience) {
        return res.status(500).send({ message: 'Internal error.' })
      }
      const payload = tokens.verify(token, secret, audience)
      if (!payload) {
        error(`Request from ${req.ip} has bad token ${token}`)
        return res.status(403).send({ message: 'Forbidden.' })
      }
      // Check admin.
      if (admin && !payload.feats.ADMIN && !payload.feats.SUPERUSER) {
        error(`Request denied for admin access to ${JSON.stringify(payload)}`)
        return res.status(403).send({ message: 'Forbidden.' })
      }
      // Check superuser.
      if (superuser && !payload.feats.SUPERUSER) {
        error(`Request denied for superuser access to ${JSON.stringify(payload)}`)
        return res.status(403).send({ message: 'Forbidden.' })
      }
      res.locals.auth = payload
      res.locals.user = payload.owner
      next()
    })
  }

  return stack
}
