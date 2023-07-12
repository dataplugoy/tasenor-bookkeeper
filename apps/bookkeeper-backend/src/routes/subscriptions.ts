import express from 'express'
import { encryptdata, vault } from '@dataplug/tasenor-common-node'
import catalog from '../lib/catalog'
import { LoginData, PluginCode, Url, log, net } from '@dataplug/tasenor-common'
import knex from '../lib/knex'
import { defaultLoginData } from '../lib/plugins'

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

    // Check out plugins handling this.
    const out = await catalog.subscribe(res.locals.user, req.body.code)
    if (out) {
      log(`Subscribing plugin '${plugin.code}' from '${res.locals.user}'.`)
      return res.send({ data: encryptdata(out) })
    }

    // Call ERP if available.
    if (process.env.TASENOR_API_URL) {
      const erp = await net.POST(`${vault.get('TASENOR_API_URL')}/subscriptions` as Url, { email: res.locals.user, code: req.body.code })
      if (erp.success) {
        const { plugins, prices, subscriptions } = erp.data as unknown as LoginData
        return res.send({ data: encryptdata({ plugins, prices, subscriptions }) })
      }
    }

    // No plugins, handle with default handling, i.e. mark into user's config.
    const db = await knex.masterDb()
    const user = await db('users').select('config').where({ email: res.locals.user }).first()

    user.config.subscriptions = user.config.subscriptions || []

    if (plugin && user.config.subscriptions.indexOf(plugin.id) < 0) {
      log(`Subscribing plugin '${plugin.code}' from '${res.locals.user}'.`)
      user.config.subscriptions.push(plugin.id)
      await db('users').update({ config: user.config }).where({ email: res.locals.user })
      const secret = defaultLoginData(user.config.subscriptions, catalog.getInstalledPluginsIDs())
      return res.send({ data: encryptdata(secret) })
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

    // Check out plugins handling this.
    const out = await catalog.unsubscribe(res.locals.user, req.params.code as PluginCode)
    if (out) {
      log(`Unsubscribing plugin '${plugin.code}' from '${res.locals.user}'.`)
      return res.send({ data: encryptdata(out) })
    }

    // Call ERP if available.
    if (process.env.TASENOR_API_URL) {
      const erp = await net.DELETE(`${vault.get('TASENOR_API_URL')}/subscriptions/${req.params.code}/${res.locals.user}` as Url)
      if (erp.success) {
        const { plugins, prices, subscriptions } = erp.data as unknown as LoginData
        return res.send({ data: encryptdata({ plugins, prices, subscriptions }) })
      }
    }

    // No plugins, handle with default handling, i.e. mark into user's config.
    const db = await knex.masterDb()
    const user = await db('users').select('config').where({ email: res.locals.user }).first()

    if (plugin && user.config.subscriptions && user.config.subscriptions.indexOf(plugin.id) >= 0) {
      log(`Unsubscribing plugin '${plugin.code}' from '${res.locals.user}'.`)
      user.config.subscriptions = user.config.subscriptions.filter(id => id !== plugin.id)
      await db('users').update({ config: user.config }).where({ email: res.locals.user })
      const secret = defaultLoginData(user.config.subscriptions, catalog.getInstalledPluginsIDs())
      return res.send({ data: encryptdata(secret) })
    }

    res.status(400).send({ message: 'Unsubscription failed.' })
  }
)

export default router
