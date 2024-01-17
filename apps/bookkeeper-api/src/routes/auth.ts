import express from 'express'
import { DAYS, LoginData, Url, error, net } from '@tasenor/common'
import { tokens, tasenorStack, isDevelopment, encryptdata, vault } from '@tasenor/common-node'
import users from '../lib/users'
import catalog from '../lib/catalog'
import { defaultLoginData } from '../lib/plugins'
import knex from '../lib/knex'

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
      if (process.env.TASENOR_API_URL) {
        const res2 = await net.POST(`${vault.get('TASENOR_API_URL')}/auth/site/login` as Url, { user })
        if (res2.success) {
          const loginData = res2.data as unknown as LoginData
          const tokens = await users.signToken(user, loginData.plugins)
          return res.send({ ...await encryptdata(loginData), ...tokens })
        }
      } else {
        // Allow all installed plugins if no service in use.
        const db = await knex.masterDb()
        const data = await db('users').select('config').where({ email: user }).first()
        const ids = data.config.subscriptions || []
        const all = catalog.getInstalledPluginsIDs()
        const loginData = defaultLoginData(ids, all)
        const tokens = await users.signToken(user, loginData.plugins)
        return res.send({ ...await encryptdata(loginData), ...tokens })
      }
    }

    res.status(401).send({ message: 'Invalid user or password.' })
  }
)

router.get('/refresh',
  tasenorStack({ json: true, url: true, audience: 'refresh' }),
  async (req, res, next) => {
    const { audience, owner, feats } = res.locals.auth
    if (!await users.verifyUser(owner)) {
      error(`User ${owner} is disabled or does not exist. Refusing the refresh.`)
      return res.status(403).send({ message: 'User is disabled or does not exist.' })
    }
    if (audience === 'bookkeeping') {
      const pair = await tokens.sign2({ owner, feats }, 'bookkeeping', isDevelopment() ? DAYS * 365 : 0).catch(next)
      return res.send(pair)
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
