import express from 'express'
import { DAYS, Email, HOURS, error } from '@tasenor/common'
import { tokens, tasenorStack, isDevelopment } from '@tasenor/common-node'
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
    if (typeof user !== 'string' || typeof password !== 'string' || !user || !password) {
      return res.status(401).send({ message: 'Invalid user or password.' })
    }
    try {
      if (await users.verifyPassword(user, password)) {
        return res.send(await signTokenWithPlugins(user as Email))
      }
    } catch (err) {
      return next(err)
    }

    res.status(401).send({ message: 'Invalid user or password.' })
  }
)

/**
 * Authenticate and construct a long-lived bookkeeping refresh token for a connector, such as the
 * MCP server's OAuth login, so that an assistant need not ask for the password every 12 hours.
 * The token only ever refreshes into an ordinary bookkeeping token, and a disabled user is
 * refused at every refresh.
 */
router.post('/connector',
  tasenorStack({ json: true, url: true }),
  async (req, res, next) => {
    const { user, password } = req.body
    if (typeof user !== 'string' || typeof password !== 'string' || !user || !password) {
      return res.status(401).send({ message: 'Invalid user or password.' })
    }
    try {
      if (await users.verifyPassword(user, password)) {
        const days = Math.max(1, parseInt(process.env.CONNECTOR_TOKEN_DAYS || '30') || 30)
        const refresh = await tokens.sign({ audience: 'bookkeeping', owner: user as Email, feats: {} }, 'refresh', days * DAYS)
        return res.send({ refresh, expires: Math.floor(Date.now() / 1000) + days * DAYS })
      }
    } catch (err) {
      return next(err)
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
      return signTokenWithPlugins(owner).then(pair => res.send(pair)).catch(next)
    }
    return res.status(403).send({ message: 'Not allowed to refresh that audience.' })
  }
)

router.get('/refresh/ui',
  tasenorStack({ json: true, url: true, audience: 'refresh' }),
  async (req, res, next) => {
    const { audience, owner, feats } = res.locals.auth
    if (audience === 'ui') {
      return tokens.sign2({ owner, feats }, 'ui', isDevelopment() ? DAYS * 365 : HOURS * 1).then(pair => res.send(pair)).catch(next)
    }
    return res.status(403).send({ message: 'Not allowed to refresh that audience.' })
  }
)

export default router
