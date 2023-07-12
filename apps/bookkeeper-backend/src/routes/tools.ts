import { ToolPlugin } from '@dataplug/tasenor-common-node'
import express from 'express'
import catalog from '../lib/catalog'
import knex from '../lib/knex'

const router = express.Router()

/**
 * Helper to check validity of request.
 */
const checkPlugin = (req, res): ToolPlugin | undefined => {
  const plugin = catalog.find(req.params.code)
  if (!plugin) {
    res.status(404).send({ message: 'Plugin not found.' })
  } else if (!(plugin instanceof ToolPlugin)) {
    res.status(400).send({ message: 'Plugin does not have REST interface.' })
  } else {
    // TODO: Check the subscription before going forward.
    return plugin
  }
}

/**
 * Helper to run request.
 */
const runPlugin = async (req, res, args) => {
  const plugin = checkPlugin(req, res)
  const method = req.method
  if (plugin) {
    const db = await knex.db(res.locals.user, res.locals.db)
    const out = await plugin[method](db, args)
    if (out === undefined) {
      return res.status(400).send({ message: `Plugin does not implement ${method} query.` })
    }
    res.send(out)
  }
}

router.get('/:code',
  async (req, res) => {
    runPlugin(req, res, req.query)
  }
)

router.delete('/:code',
  async (req, res) => {
    runPlugin(req, res, req.query)
  }
)

router.put('/:code',
  async (req, res) => {
    runPlugin(req, res, req.body)
  }
)

router.patch('/:code',
  async (req, res) => {
    runPlugin(req, res, req.body)
  }
)

router.post('/:code',
  async (req, res) => {
    runPlugin(req, res, req.body)
  }
)

export default router
