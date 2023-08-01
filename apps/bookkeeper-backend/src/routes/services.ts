import { PluginService } from '@tasenor/common'
import { KnexDatabase } from '@tasenor/common-node'
import express from 'express'
import catalog from '../lib/catalog'
import knex from '../lib/knex'

const router = express.Router()

router.get('/',
  async (req, res) => {
    res.send(catalog.getServices())
  }
)

router.get('/:service',
  async (req, res, next) => {
    const { service } = req.params
    const plugins = catalog.getServiceProviders(service)
    const best = { status: 404, message: 'No handlers found.' }

    let db: KnexDatabase
    for (const plugin of plugins) {
      if (res.locals.db) {
        db = await knex.db(res.locals.user, res.locals.db)
      } else {
        db = knex.masterDb()
      }
      await plugin.executeQuery(best, db, service as PluginService, req.query).catch(next)
    }

    res.status(best.status).send(best)
  }
)

export default router
