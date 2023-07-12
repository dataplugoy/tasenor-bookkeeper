import { HttpResponse, isHttpSuccessResponse } from '@dataplug/tasenor-common'
import express from 'express'
import data from '../lib/data'
import knex from '../lib/knex'
import { create, update } from '../lib/entry'

const router = express.Router()

router.get('/',
  async (req, res, next) => {
    const db = await knex.db(res.locals.user, res.locals.db)
    let q = db('entry').select('entry.*', 'document.date').join('document', 'document.id', '=', 'entry.document_id').where(true)
    if (req.query.text) {
      q = q.andWhere({ description: req.query.text })
    }
    if (req.query.account_id) {
      q = q.andWhere({ account_id: parseInt(req.query.account_id as string) })
    }
    if (req.query.period_id) {
      q = q.andWhere({ period_id: parseInt(req.query.period_id as string) })
    }

    const entries = await q.orderBy(['document.date', 'document.number', 'entry.row_number', 'entry.id'])
    res.send(entries.map(entry => ({ ...entry, amount: Math.round(entry.amount * 100) })))
  })

router.post('/',
  async (req, res, next) => {
    const message: HttpResponse = await create(await knex.db(res.locals.user, res.locals.db), req.body)
    return isHttpSuccessResponse(message) ? res.status(message.status).send(message.data) : res.status(message.status).send({ messae: message.message })
  })

router.get('/:id',
  async (req, res, next) => {
    data.getOne(await knex.db(res.locals.user, res.locals.db), 'entry', parseInt(req.params.id))
      .then(entry => {
        if (!entry) {
          return res.status(404).send({ message: 'Entry not found.' })
        }
        res.send(entry)
      })
      .catch(next)
  })

router.patch('/:id',
  async (req, res, next) => {
    const entry = await data.getOne(await knex.db(res.locals.user, res.locals.db), 'entry', parseInt(req.params.id))
    if (!entry) {
      return res.status(404).send({ message: 'Entry not found.' })
    }
    entry.amount = Math.round(entry.amount * 100)
    Object.assign(entry, req.body)
    const message: HttpResponse = await update(await knex.db(res.locals.user, res.locals.db), entry)
    return isHttpSuccessResponse(message) ? res.status(message.status).send(message.data) : res.status(message.status).send({ messae: message.message })
  })

router.delete('/:id',
  async (req, res, next) => {
    const locked = await data.isLocked(await knex.db(res.locals.user, res.locals.db), 'entry', parseInt(req.params.id))
    if (locked) {
      res.sendStatus(400)
      return
    }
    data.deleteOne(await knex.db(res.locals.user, res.locals.db), 'entry', parseInt(req.params.id))
      .then(() => res.sendStatus(204))
      .catch(next)
  })

export default router
