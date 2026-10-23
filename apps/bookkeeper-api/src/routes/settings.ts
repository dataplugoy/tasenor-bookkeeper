import express from 'express'
import knex from '../lib/knex'

const router = express.Router()

router.get('/',
  async (req, res, next) => {
    knex.dbSettings(res.locals.user, res.locals.db)
      .then(settings => res.send(settings))
      .catch(next)
  }
)

router.patch('/',
  async (req, res, next) => {
    knex.changeDbSettings(res.locals.user, res.locals.db, req.body)
      .then(() => res.sendStatus(204))
      .catch(next)
  }
)

export default router
