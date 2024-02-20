import express from 'express'
import { plugins } from '@tasenor/common-node'
import { install, uninstall, reset } from '../lib/plugins'
import server from '../lib/server'
import catalog from '../lib/catalog'
import { tasenor } from '../lib/middleware'
import path from 'path'
import { DirectoryPath, LocalUrl, POST, Value, warning } from '@tasenor/common'

const { findPluginFromIndex, loadPluginIndex, updatePluginList } = plugins
const router = express.Router()

router.get('/',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res) => {
    plugins.verifyPluginDir()
    await updatePluginList()
    const list = await loadPluginIndex()
    res.send(list.map(p => ({ ...p, path: null })))
  }
)

router.get('/rebuild',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res) => {
    await updatePluginList()
    res.status(204).send()
  }
)

router.get('/publish',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res) => {
    if (process.env.TASENOR_API_URL) {
      const list = await loadPluginIndex()
      for (const plugin of list) {
        await POST('/plugins/publish' as LocalUrl, plugin as unknown as Value)
      }
    }
    res.status(204).send()
  }
)

router.get('/upgrade',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res) => {
    plugins.verifyPluginDir()
    const root = path.join(__dirname, '..', '..', '..', '..') as DirectoryPath
    await plugins.upgradeRepositories(root)
    await updatePluginList()
    res.status(204).send()
    warning('Rebooting in 3 seconds...')
    setTimeout(() => server.kill(), 3000)
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
