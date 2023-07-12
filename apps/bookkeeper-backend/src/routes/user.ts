import { error, UserDataModel } from '@dataplug/tasenor-common'
import { tokens } from '@dataplug/tasenor-common-node'
import express from 'express'
import users from '../lib/users'
import { tasenor } from '../lib/middleware'
import system from '../lib/system'
import knex from '../lib/knex'

const router = express.Router()

router.get('/',
  ...tasenor({ admin: true }),
  async (req, res, next) => {
    users.getAll()
      .then((users) => res.send(users))
      .catch(next)
  })

router.get('/current-user',
  ...tasenor({ user: true }),
  async (req, res, next) => {
    users.getOne(res.locals.user)
      .then((user) => res.send(user))
      .catch(next)
  }
)

router.get('/:user',
  ...tasenor({ admin: true }),
  async (req, res, next) => {
    const user: Object | null = await users.getOne(req.params.user)
    if (!user) {
      return res.status(404).send({ message: 'No such user.' })
    }
    res.send(user)
  }
)

router.get('/:user/databases',
  ...tasenor({ admin: true }),
  async (req, res, next) => {
    const databases = await users.databases(req.params.user)
    res.send(databases)
  }
)

router.post('/:user/databases',
  ...tasenor({ admin: true }),
  async (req, res, next) => {
    const user: UserDataModel | null = await users.getOne(req.params.user)
    if (!user) {
      return res.status(404).send({ message: 'No such user.' })
    }
    const db = knex.masterDb()
    const target = await db('databases').select('id').where({ name: req.body.database }).first()
    if (!target) {
      return res.status(404).send({ message: 'No such database.' })
    }
    if (await db('database_users').where({ user_id: user.id, database_id: target.id }).first()) {
      return res.status(400).send({ message: 'Already using that database.' })
    }
    await db('database_users').insert({ user_id: user.id, database_id: target.id, config: {} })
    res.sendStatus(204)
  }
)

router.post('/',
  async (req, res, next) => {
    const { name, password, email } = req.body
    if (!await system.get('canRegister').catch(next)) {
      if (!await users.verifyToken(tokens.get(req), true)) {
        return res.status(403).send({ message: 'Unauthorized.' })
      }
    }
    const err = await users.validateUser(name, password, email).catch(next)
    if (err !== true) {
      error(err)
      return res.status(400).send({ message: err })
    }

    if (await system.get('isEmailConfirmationRequired').catch(next)) {
      return res.status(400).send({ message: 'Email confirmation is not yet implemented.' })
    }

    const result = await users.registerUser({ name, password, email, admin: false, superuser: false }).catch(next)
    if (result) {
      return res.send(result)
    }
    return res.status(500).send({ message: 'Registration failed.' })
  }
)

router.delete('/:email',
  ...tasenor({ admin: true }),
  async (req, res, next) => {
    await users.deleteOne(req.params.email)
      .then(() => res.sendStatus(204))
      .catch(() => res.status(404).send({ message: 'No such user.' }))
  }
)

export default router
