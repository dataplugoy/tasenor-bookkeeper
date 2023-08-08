import express from 'express'
import system from '../lib/system'
import { tasenor } from '../lib/middleware'
import catalog from '../lib/catalog'

const router = express.Router()

router.get('/settings/plugins',
  ...tasenor({ admin: true }),
  async (req, res, next) => {
    const settings = await system.settings().catch(next)
    if (!settings) {
      return res.status(500).send({ message: 'Getting settings failed.' })
    }
    const values = {}
    Object.keys(settings).forEach(name => {
      if (name.indexOf('.') < 0) {
        return
      }
      const [plugin, variable] = name.split('.')
      values[plugin] = values[plugin] || {}
      values[plugin][variable] = settings[name]
    })
    const results = {}
    catalog.getPluginsWithSettings().forEach(plugin => {
      results[plugin.code] = {
        code: plugin.code,
        title: plugin.title,
        settings: values[plugin.code] || {},
        ui: plugin.getSettings()
      }
    })
    res.send(results)
  }
)

router.get('/settings',
  async (req, res, next) => {
    const settings = await system.settings().catch(next)
    if (!settings) {
      return res.status(500).send({ message: 'Getting settings failed.' })
    }
    Object.keys(settings).forEach(k => {
      if (k.indexOf('.') > 0) {
        delete settings[k]
      }
    })
    res.send(settings)
  }
)

router.patch('/settings/plugins',
  ...tasenor({ admin: true }),
  async (req, res, next) => {
    await system.set(req.body).catch(next)
    res.sendStatus(204)
  }
)

router.patch('/settings',
  ...tasenor({ admin: true }),
  async (req, res, next) => {
    await system.set(req.body).catch(next)
    res.sendStatus(204)
  }
)

export default router
