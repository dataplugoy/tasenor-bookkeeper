import express from 'express'
import data from '../lib/data'
import knex from '../lib/knex'

const router = express.Router()

router.get('/',
  async (req, res, next) => {
    data.listAll(await knex.db(res.locals.user, res.locals.db), 'heading', null, ['number', 'level'])
      .then(data => res.send(data))
      .catch(next)
  })

export default router
