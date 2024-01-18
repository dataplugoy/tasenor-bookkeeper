import express from 'express'
import { DAYS, LoginData, Url, error, net } from '@tasenor/common'
import { tokens, tasenorStack, isDevelopment, encryptdata, vault } from '@tasenor/common-node'
import users from '../lib/users'
import { signTokenWithPlugins } from '../lib/subscriptions'

const router = express.Router()

/**
 * Authenticate against fixed credentials and construct a token.
 */
router.post('/',
  tasenorStack({ json: true, url: true }),
  async (req, res, next) => {
    const { user, password } = req.body
    const valid = await users.verifyPassword(user, password).catch(next)
    if (valid) {
      return res.send(await signTokenWithPlugins(user))
    }

    res.status(401).send({ message: 'Invalid user or password.' })
  }
)

router.get('/refresh',
  tasenorStack({ json: true, url: true, audience: 'refresh' }),
  async (req, res, next) => {
    const { audience, owner } = res.locals.auth
    if (!await users.verifyUser(owner)) {
      error(`User ${owner} is disabled or does not exist. Refusing the refresh.`)
      return res.status(403).send({ message: 'User is disabled or does not exist.' })
    }
    if (audience === 'bookkeeping') {
      return res.send(await signTokenWithPlugins(owner).catch(next))
    }
    return res.status(403).send({ message: 'Not allowed to refresh that audience.' })
  }
)

router.get('/refresh/ui',
  tasenorStack({ json: true, url: true, audience: 'refresh' }),
  async (req, res, next) => {
    const { audience, owner, feats } = res.locals.auth
    if (audience === 'ui') {
      const pair = await tokens.sign2({ owner, feats }, 'ui', isDevelopment() ? DAYS * 365 : 0).catch(next)
      return res.send(pair)
    }
    return res.status(403).send({ message: 'Not allowed to refresh that audience.' })
  }
)

export default router
