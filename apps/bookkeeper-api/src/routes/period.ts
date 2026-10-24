import express from 'express'
import { isHttpSuccessResponse } from '@tasenor/common'
import data from '../lib/data'
import knex from '../lib/knex'
import { create, collectAssets } from '../lib/period'

const router = express.Router()

router.get('/',
  async (req, res, next) => {
    data.listAll(await knex.db(res.locals.user, res.locals.db), 'period', null, ['-start_date'])
      .then(periods => res.send(periods))
      .catch(next)
  }
)

router.get('/:id',
  async (req, res, next) => {
    const db = await knex.db(res.locals.user, res.locals.db)
    data.getPeriodBalances(db, parseInt(req.params.id))
      .then(async balances => {
        if (!balances) {
          return res.status(404).send({ message: 'Period not found.' })
        }
        if ('data' in req.query) {
          balances.data = await collectAssets(db, parseInt(req.params.id))
        }
        res.send(balances)
      })
      .catch(next)
  }
)

router.delete('/:id',
  async (req, res, next) => {
    const db = await knex.db(res.locals.user, res.locals.db)
    const id = parseInt(req.params.id)
    data.getPeriodBalances(db, id)
      .then(async balances => {
        if (!balances) {
          return res.status(404).send({ message: 'Period not found.' })
        }
        if (balances.balances.length !== 0) {
          return res.status(400).send({ message: 'Period must have no transactions before deleting it.' })
        }
        await data.deleteOne(db, 'period', id)
        res.status(204).send()
      })
      .catch(next)
  }
)

router.post('/', async (req, res, next) => {
  const db = await knex.db(res.locals.user, res.locals.db)
  const text = req.body.text
  delete req.body.text
  return create(db, req.body, text)
    .then((message) => {
      if (!message) {
        return res.status(500).send({ message: 'Failed to create period.' })
      }
      return isHttpSuccessResponse(message) ? res.status(message.status).send(message.data) : res.status(message.status).send({ message: message.message })
    })
    .catch(next)
})

router.patch('/:id',
  async (req, res, next) => {
    const obj = req.body
    const db = await knex.db(res.locals.user, res.locals.db)
    const id = parseInt(req.params.id)
    // Changed dates must still form a proper range not overlapping other periods.
    if ('start_date' in obj || 'end_date' in obj) {
      const old = await db('period').where({ id }).first()
      if (!old) {
        return res.status(404).send({ message: 'Period not found.' })
      }
      const start = obj.start_date ?? old.start_date
      const end = obj.end_date ?? old.end_date
      if (!start || !end || start > end) {
        return res.status(400).send({ message: 'Invalid period dates.' })
      }
      const overlapping = await db('period').whereNot({ id }).andWhere('start_date', '<=', end).andWhere('end_date', '>=', start).first()
      if (overlapping) {
        return res.status(400).send({ message: 'Period overlaps with an existing period.' })
      }
    }
    data.updateOne(db, 'period', id, obj)
      .then(() => res.status(204).send())
      .catch(next)
  }
)

export default router
