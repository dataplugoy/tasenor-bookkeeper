import express from 'express'
import { encryptdata, vault } from '@tasenor/common-node'
import catalog from '../lib/catalog'
import { DELETE, POST, PluginCode, Url, log } from '@tasenor/common'
import knex from '../lib/knex'
import users from '../lib/users'
import { signTokenWithPlugins } from '../lib/subscriptions'

const router = express.Router()

/**
 * Subscribe to the plugin.
 */
router.post('/',
  async (req, res) => {
    // Verify that plugin exists.
    const plugin = catalog.findAvailable(req.body.code as PluginCode)
    if (!plugin) {
      return res.status(404).send({ message: 'Plugin not found' })
    }

    log(`Subscribing plugin '${plugin.code}' from '${res.locals.user}'.`)

    // Check out plugins handling this.
    const loginData = await catalog.subscribe(res.locals.user, req.body.code)
    if (loginData) {
      const tokens = await users.signToken(res.locals.user, loginData.plugins)
      return res.send({ ...tokens, data: await encryptdata(loginData) })
    }

    // Call API if available.
    if (process.env.TASENOR_API_URL) {
      const erp = await POST(`${vault.get('TASENOR_API_URL')}/subscriptions` as Url, { email: res.locals.user, code: req.body.code })
      if (erp.success) {
        return res.send(await signTokenWithPlugins(res.locals.user))
      }
      res.status(400).send({ message: 'Subscription failed.' })
    }

    // No plugins, handle with default handling, i.e. mark into user's config.
    const db = await knex.masterDb()
    const user = await db('users').select('config').where({ email: res.locals.user }).first()

    user.config.subscriptions = user.config.subscriptions || []

    if (plugin && user.config.subscriptions.indexOf(plugin.id) < 0) {
      log(`Subscribing plugin '${plugin.code}' from '${res.locals.user}'.`)
      user.config.subscriptions.push(plugin.id)
      await db('users').update({ config: user.config }).where({ email: res.locals.user })
      return res.send(await signTokenWithPlugins(res.locals.user))
    }

    res.status(400).send({ message: 'Subscription failed.' })
  }
)

/**
 * Unsubscribe plugin.
 */
router.delete('/:code',
  async (req, res) => {
    // Verify that plugin exists.
    const plugin = catalog.findAvailable(req.params.code as PluginCode)
    if (!plugin) {
      return res.status(404).send({ message: 'Plugin not found' })
    }

    log(`Unsubscribing plugin '${plugin.code}' from '${res.locals.user}'.`)

    // Check out plugins handling this.
    const loginData = await catalog.unsubscribe(res.locals.user, req.params.code as PluginCode)
    if (loginData) {
      const tokens = await users.signToken(res.locals.user, loginData.plugins)
      return res.send({ ...tokens, data: await encryptdata(loginData) })
    }

    // Call API if available.
    if (process.env.TASENOR_API_URL) {
      const erp = await DELETE(`${vault.get('TASENOR_API_URL')}/subscriptions/${req.params.code}/${res.locals.user}` as Url)
      if (erp.success) {
        return res.send(await signTokenWithPlugins(res.locals.user))
      }
      res.status(400).send({ message: 'Unsubscription failed.' })
    }

    // No plugins, handle with default handling, i.e. mark into user's config.
    const db = await knex.masterDb()
    const user = await db('users').select('config').where({ email: res.locals.user }).first()

    if (plugin && user.config.subscriptions && user.config.subscriptions.indexOf(plugin.id) >= 0) {
      log(`Unsubscribing plugin '${plugin.code}' from '${res.locals.user}'.`)
      user.config.subscriptions = user.config.subscriptions.filter(id => id !== plugin.id)
      await db('users').update({ config: user.config }).where({ email: res.locals.user })
      return res.send(await signTokenWithPlugins(res.locals.user))
    }

    res.status(400).send({ message: 'Unsubscription failed.' })
  }
)

export default router
