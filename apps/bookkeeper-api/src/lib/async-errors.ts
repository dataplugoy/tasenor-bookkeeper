/**
 * Make Express 4 pass rejected promises of async route handlers to the error handler.
 *
 * Express 4 only catches errors thrown synchronously. An async handler failing after an await
 * produces an unhandled rejection, which terminates the server. This wraps the handler call
 * the same way the express-async-errors package does.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Layer = require('express/lib/router/layer')

const original = Layer.prototype.handle_request

if (!original.asyncErrorsPatched) {
  const patched = function handle(req, res, next) {
    const fn = this.handle
    if (fn.length > 3) {
      // Error handler, not a standard request handler.
      return original.call(this, req, res, next)
    }
    try {
      const result = fn(req, res, next)
      if (result && typeof result.catch === 'function') {
        result.catch(err => next(err))
      }
    } catch (err) {
      next(err)
    }
  }
  patched.asyncErrorsPatched = true
  Layer.prototype.handle_request = patched
}

export {}
