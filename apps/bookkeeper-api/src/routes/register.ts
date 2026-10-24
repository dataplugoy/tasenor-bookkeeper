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
    if (!admin) {
      return res.sendStatus(400)
    }
    try {
      if (await users.hasAdminUser()) {
        return res.sendStatus(400)
      }
      const err = await users.validateUser(name, password, email)
      if (err !== true) {
        error(err)
        return res.status(400).send({ message: err })
      }
      if (!await users.registerUser({ name, email, password, admin, superuser: true })) {
        return res.sendStatus(500)
      }
      res.sendStatus(204)
    } catch (err) {
      next(err)
    }
  }
)

export default router
