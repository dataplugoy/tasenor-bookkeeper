import express from 'express'
import data from '../lib/data'
import knex from '../lib/knex'
import { create, update } from '../lib/document'
import { HttpResponse, isHttpSuccessResponse } from '@dataplug/tasenor-common'

const router = express.Router()

router.get('/',
  async (req, res, next) => {
    let where = null
    let order = ['number']
    if (req.query.period) {
      if ('entries' in req.query) {
        return data.getPeriodTransactionsWithEntries(await knex.db(res.locals.user, res.locals.db), parseInt(req.query.period as string))
          .then((documents) => res.send(documents))
      }
      where = { period_id: parseInt(req.query.period as string) }
      order = ['date', 'number', 'id']
    }
    data.listAll(await knex.db(res.locals.user, res.locals.db), 'document', where, order)
      .then(documents => res.send(documents))
      .catch(next)
  }
)

router.get('/:id',
  async (req, res, next) => {
    data.getOne(await knex.db(res.locals.user, res.locals.db), 'document', parseInt(req.params.id as string), 'entry', ['row_number'])
      .then(document => {
        if (!document) {
          return res.status(404).send({ message: 'Document not found.' })
        }
        document.entries.forEach((e) => {
          e.amount = Math.round(e.amount * 100)
        })
        res.send(document)
      })
      .catch(next)
  }
)

router.post('/',
  async (req, res) => {
    const message: HttpResponse = await create(await knex.db(res.locals.user, res.locals.db), req.body)
    return isHttpSuccessResponse(message) ? res.status(message.status).send(message.data) : res.status(message.status).send({ messae: message.message })
  }
)

router.patch('/:id',
  async (req, res) => {
    const message: HttpResponse = await update(await knex.db(res.locals.user, res.locals.db), req.body)
    return isHttpSuccessResponse(message) ? res.status(message.status).send(message.data) : res.status(message.status).send({ messae: message.message })
  }
)

router.delete('/:id',
  async (req, res, next) => {
    const id = parseInt(req.params.id)
    const doc = await data.getOne(await knex.db(res.locals.user, res.locals.db), 'document', id)
    if (!doc) {
      return res.status(404).send({ message: 'No such document.' })
    }
    const locked = await data.isLocked(await knex.db(res.locals.user, res.locals.db), 'document', id)
    if (locked) {
      return res.status(400).send({ message: 'Period is locked.' })
    }
    await (await knex.db(res.locals.user, res.locals.db))('segment_document').delete('*').where({ document_id: id })
    return data.deleteMany(await knex.db(res.locals.user, res.locals.db), 'entry', { document_id: id })
      .then(async () => data.deleteOne(await knex.db(res.locals.user, res.locals.db), 'document', id))
      .then(() => res.sendStatus(204))
      .catch(next)
  }
)

export default router
