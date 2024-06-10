import express from 'express'
import users from '../lib/users'
const router = express.Router()

/**
 * Change some allowed user config settings.
 */
router.patch('/config',
  async (req, res) => {
    if (req.body.db !== undefined) {
      await users.setConfig(res.locals.user, 'db', req.body.db)
    }
    if (req.body.periodId !== undefined) {
      await users.setConfig(res.locals.user, 'periodId', req.body.periodId)
    }
    res.send({})
  }
)

export default router
