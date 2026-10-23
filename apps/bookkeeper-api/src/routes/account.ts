import { KnexConfig } from '@tasenor/common-node'
import express from 'express'
import data from '../lib/data'
import knex from '../lib/knex'

const router = express.Router()

router.get('/',
  async (req, res, next) => {
    data.listAll(await knex.db(res.locals.user, res.locals.db), 'account', null, ['number'])
      .then(data => res.send(data))
      .catch(next)
  }
)

router.get('/:id',
  async (req, res, next) => {
    if (!req.params.id) {
      res.sendStatus(404)
      return
    }
    const periods = await data.getAccountTransactionCountByPeriod(await knex.db(res.locals.user, res.locals.db), req.params.id)
    data.getOne(await knex.db(res.locals.user, res.locals.db), 'account', parseInt(req.params.id))
      .then(account => {
        if (!account) {
          res.sendStatus(404)
          return
        }
        account.periods = periods
        res.send(account)
      })
      .catch(next)
  }
)

router.patch('/:id',
  async (req, res, next) => {
    const obj = req.body
    data.updateOne(await knex.db(res.locals.user, res.locals.db), 'account', parseInt(req.params.id), obj)
      .then(() => res.sendStatus(204))
      .catch(next)
  }
)

router.post('/',
  async (req, res, next) => {
    try {
      const obj = req.body
      const conf: Record<string, unknown> = await knex.dbSettings(res.locals.user, res.locals.db) as KnexConfig
      if (!obj.currency) {
        obj.currency = conf.currency
      }
      if (!obj.language) {
        obj.language = conf.language
      }
      if (!obj.currency) {
        return res.status(400).send({ message: `Currency is not configured for db ${res.locals.db}.` })
      }
      if (!obj.language) {
        return res.status(400).send({ message: `Language is not configured for db ${res.locals.db}.` })
      }
      const entry = await data.createOne(await knex.db(res.locals.user, res.locals.db), 'account', obj)
      return entry ? res.send(entry) : res.sendStatus(400)
    } catch (err) {
      next(err)
    }
  }
)

router.delete('/:id',
  async (req, res) => {
    const id = parseInt(req.params.id)
    const periods = await data.getAccountTransactionCountByPeriod(await knex.db(res.locals.user, res.locals.db), id)
    let locked = false
    periods.forEach(async (period) => {
      if (period.entries || period.locked) {
        locked = true
      }
    })
    if (locked) {
      res.sendStatus(403)
    } else {
      await data.deleteOne(await knex.db(res.locals.user, res.locals.db), 'account', id)
      res.sendStatus(204)
    }
  }
)

export default router
