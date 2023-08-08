import { tasenorStack } from '@tasenor/common-node'
import knex from './knex'

/**
 * A constructor for tasenor middleware stack based on the arguments.
 *
 * Each flag adds one or more functions to the stack returned.
 *
 * Additional flags:
 * - db Check that user has access to the db given as parameter.
 */
export function tasenor(params) {
  // Set automatic up implications.
  if (params.db) {
    params.user = true
  }

  // Get basics.
  const stack = tasenorStack(params)

  // Add DB check middleware.
  if (params.db) {
    stack.push(async (req, res, next) => {
      const { db } = req.params
      if (!res.locals.user || !(await knex.isDb(res.locals.user, db))) {
        res.status(404).send({ message: 'Database not found.' })
      } else {
        res.locals.db = db
        next()
      }
    })
  }

  return stack
}

export default {
  tasenor
}
