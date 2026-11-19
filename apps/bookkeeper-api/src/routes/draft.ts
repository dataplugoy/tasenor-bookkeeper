import express, { NextFunction, Request, Response } from 'express'
import { isHttpSuccessResponse } from '@tasenor/common'
import knex from '../lib/knex'
import { confirm, create } from '../lib/draft'

const router = express.Router()

const handle = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res).catch(next)
}

/**
 * List drafts, optionally of one period, oldest first.
 */
router.get('/',
  handle(async (req, res) => {
    const db = await knex.db(res.locals.user, res.locals.db)
    let q = db('draft').select('*')
    if (req.query.period) {
      q = q.where({ period_id: parseInt(req.query.period as string) })
    }
    res.send(await q.orderBy(['date', 'id']))
  })
)

router.get('/:id',
  handle(async (req, res) => {
    const db = await knex.db(res.locals.user, res.locals.db)
    const draft = await db('draft').select('*').where({ id: parseInt(req.params.id) }).first()
    if (!draft) {
      return res.status(404).send({ message: 'Draft not found.' })
    }
    res.send(draft)
  })
)

router.post('/',
  handle(async (req, res) => {
    const message = await create(await knex.db(res.locals.user, res.locals.db), req.body, res.locals.user)
    return isHttpSuccessResponse(message) ? res.status(message.status).send(message.data) : res.status(message.status).send({ message: message.message })
  })
)

/**
 * Book the draft as a document.
 */
router.post('/:id/confirm',
  handle(async (req, res) => {
    const message = await confirm(await knex.db(res.locals.user, res.locals.db), parseInt(req.params.id), res.locals.user)
    return isHttpSuccessResponse(message) ? res.status(message.status).send(message.data) : res.status(message.status).send({ message: message.message })
  })
)

router.delete('/:id',
  handle(async (req, res) => {
    const db = await knex.db(res.locals.user, res.locals.db)
    const count = await db('draft').where({ id: parseInt(req.params.id) }).delete()
    if (!count) {
      return res.status(404).send({ message: 'Draft not found.' })
    }
    res.sendStatus(204)
  })
)

export default router
