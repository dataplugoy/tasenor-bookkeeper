import express from 'express'
import knex from '../lib/knex'

const router = express.Router()

router.get('/',
  async (req, res, next) => {
    const settings = await knex.dbSettings(res.locals.user, res.locals.db).catch(next)
    res.send(settings)
  }
)

router.patch('/',
  async (req, res, next) => {
    await knex.changeDbSettings(res.locals.user, res.locals.db, req.body).catch(next)
    res.sendStatus(204)
  }
)

export default router
