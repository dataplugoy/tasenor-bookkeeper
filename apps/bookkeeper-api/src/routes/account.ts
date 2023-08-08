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
    const obj = req.body
    const conf: Record<string, unknown> = await knex.dbSettings(res.locals.user, res.locals.db).catch(next) as KnexConfig
    if (!obj.currency) {
      obj.currency = conf.currency
    }
    if (!obj.language) {
      obj.language = conf.language
    }
    if (!conf.currency) {
      throw new Error(`Currency is not configured for db ${res.locals.db}.`)
    }
    if (!conf.language) {
      throw new Error(`Language is not configured for db ${res.locals.db}.`)
    }
    data.createOne(await knex.db(res.locals.user, res.locals.db), 'account', obj)
      .then(entry => entry ? res.send(entry) : res.sendStatus(400))
      .catch(next)
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
