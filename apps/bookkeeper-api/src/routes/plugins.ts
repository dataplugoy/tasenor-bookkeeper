import express from 'express'
import { plugins } from '@tasenor/common-node'
import { tasenor } from '../lib/middleware'

const { loadPluginIndex, updatePluginList } = plugins
const router = express.Router()

router.get('/',
  ...tasenor({ superuser: true, audience: ['bookkeeping', 'ui'] }),
  async (req, res) => {
    await updatePluginList()
    const list = await loadPluginIndex()
    res.send(list.map(p => ({ ...p, path: null })))
  }
)

export default router
