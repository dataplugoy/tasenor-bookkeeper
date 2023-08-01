import express from 'express'
import users from '../lib/users'
import { error } from '@tasenor/common'

const router = express.Router()

/**
 * Create new user.
 */
router.post('/',
  async (req, res, next) => {
    const { name, email, password, admin } = req.body
    if (admin) {
      if (await users.hasAdminUser()) {
        res.sendStatus(400)
      } else {
        const err = await users.validateUser(name, password, email).catch(next)
        if (err !== true) {
          error(err)
          res.sendStatus(400)
        } else if (!await users.registerUser({ name, email, password, admin, superuser: true }).catch(next)) {
          res.sendStatus(500)
        } else {
          res.sendStatus(204)
        }
      }
    } else {
      res.sendStatus(400)
    }
  }
)

export default router
