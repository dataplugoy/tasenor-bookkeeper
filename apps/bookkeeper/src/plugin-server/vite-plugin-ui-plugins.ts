import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { createRequire } from 'node:module'
import { join } from 'node:path'

/**
 * Parse JSON body from an IncomingMessage.
 */
function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(undefined)
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

interface ExpressLikeRequest extends IncomingMessage {
  path: string
  body?: unknown
  originalUrl: string
}

interface ExpressLikeResponse extends ServerResponse {
  status: (code: number) => ExpressLikeResponse
  send: (data: unknown) => void
  sendStatus: (code: number) => void
}

/**
 * Shim Express-like methods onto connect's raw req/res objects.
 */
function expressify(req: IncomingMessage, res: ServerResponse): { req: ExpressLikeRequest, res: ExpressLikeResponse } {
  const exReq = req as ExpressLikeRequest
  const exRes = res as ExpressLikeResponse

  // req.path — strip query string from req.url
  exReq.path = (req.url || '/').split('?')[0]

  // res.status(code) — chainable
  exRes.status = (code: number) => {
    res.statusCode = code
    return exRes
  }

  // res.send(data) — serialize objects as JSON
  exRes.send = (data: unknown) => {
    if (typeof data === 'object' && data !== null) {
      if (!res.getHeader('content-type')) {
        res.setHeader('Content-Type', 'application/json')
      }
      res.end(JSON.stringify(data))
    } else if (typeof data === 'string') {
      res.end(data)
    } else {
      res.end()
    }
  }

  // res.sendStatus(code)
  exRes.sendStatus = (code: number) => {
    res.statusCode = code
    res.end()
  }

  return { req: exReq, res: exRes }
}

/**
 * Vite plugin that serves UI plugin management endpoints
 * directly inside the Vite dev server, replacing the standalone
 * Express-based ui-plugin-server.
 */
export function uiPluginsPlugin(): Plugin {
  return {
    name: 'tasenor-ui-plugins',
    configureServer(server) {
      // Load the middleware via CJS require() with tsx registered.
      // CJS natively handles directory imports (@tasenor/common) and
      // CJS named exports (fast-glob) — matching `npx tsx` behavior.
      const cjsRequire = createRequire(join(server.config.root, 'vite.config.mts'))
      cjsRequire('tsx/cjs')
      const middlewarePath = join(server.config.root, 'src', 'plugin-server', 'ui-plugin-middleware.ts')
      const mod = cjsRequire(middlewarePath)
      let initError: unknown = null
      const ready = mod.initialize().catch((err: unknown) => {
        console.error('Failed to initialize plugin middleware:', err)
        initError = err
      })

      return () => {
        server.middlewares.use('/internal/plugins', async (req, res, next) => {
          try {
            await ready
            if (initError) {
              res.statusCode = 503
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ message: 'Plugin middleware failed to initialize.' }))
              return
            }
            const shimmed = expressify(req, res)
            if (req.method === 'POST' || req.method === 'DELETE' || req.method === 'PATCH') {
              shimmed.req.body = await parseJsonBody(req)
            }
            await mod.middleware(shimmed.req, shimmed.res, next)
          } catch (err) {
            next(err)
          }
        })
      }
    }
  }
}
