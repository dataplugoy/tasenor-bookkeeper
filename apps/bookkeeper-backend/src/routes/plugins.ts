import express from 'express'
import { plugins } from '@dataplug/tasenor-common-node'
import { install, uninstall, reset } from '../lib/plugins'
import catalog from '../lib/catalog'
import { tasenor } from '../lib/middleware'

const { findPluginFromIndex, loadPluginIndex, updatePluginList } = plugins
const router = express.Router()

router.get('/',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res) => {
    let plugins = await loadPluginIndex()
    if (plugins.length === 0) {
      await updatePluginList()
      plugins = await loadPluginIndex()
    }
    res.send(plugins.map(p => ({ ...p, path: null })))
  }
)

router.get('/rebuild',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res) => {
    await updatePluginList()
    res.status(204).send()
  }
)

router.get('/reset',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res) => {
    await reset()
    res.status(204).send()
  }
)

router.get('/auth',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res) => {
    res.status(204).send()
  }
)

router.post('/',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res, next) => {
    const { code, version } = req.body
    if (!code) {
      return res.status(400).send({ message: 'Plugin code missing.' })
    }
    if (!version) {
      return res.status(400).send({ message: 'Plugin version missing.' })
    }
    const plugin = findPluginFromIndex(code)
    if (!plugin) {
      return res.status(404).send({ message: `Cannot find plugin ${code}.` })
    }

    const message = await install(code, version)
    if (message) {
      return res.status(400).send({ message })
    }

    await catalog.reload().catch(next)
    await catalog.install(code).catch(next)

    res.send(findPluginFromIndex(code))
  }
)

router.delete('/',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res, next) => {
    const { code } = req.body
    if (!code) {
      return res.status(400).send({ message: 'Plugin code not given.' })
    }
    const plugin = findPluginFromIndex(code)
    if (!plugin || !plugin.installedVersion) {
      return res.status(400).send({ message: 'Plugin is not installed.' })
    }

    await catalog.uninstall(code).catch(next)
    await uninstall(code).catch(next)

    await updatePluginList().catch(next)
    await catalog.reload().catch(next)

    res.send(findPluginFromIndex(code))
  }
)

export default router
