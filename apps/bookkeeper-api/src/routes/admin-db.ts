import express from 'express'
import { tasenor } from '../lib/middleware'
import db from '../lib/db'
import users from '../lib/users'
import knex from '../lib/knex'

const router = express.Router()

router.get('/',
  ...tasenor({ admin: true }),
  async (_req, res) => {

    const allDbs = await db.getAll()
    const dbs = allDbs.reduce((prev, cur) => ({ ...prev, [`${cur.id}`]: cur }), {})
    const usrs = (await users.getAll()).reduce((prev, cur) => ({ ...prev, [`${cur.id}`]: cur }), {})

    const master = knex.masterDb()
    const dbUsers = await master('database_users').select('*')

    dbUsers.forEach((dbUser) => {
      dbs[dbUser.database_id].users = dbs[dbUser.database_id].users || []
      dbs[dbUser.database_id].users.push({
        user: usrs[dbUser.user_id],
        config: dbUser.config,
        created: dbUser.created
      })
    })

    res.send(allDbs)
  })

export default router
