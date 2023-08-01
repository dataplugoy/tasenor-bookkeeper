import express from 'express'
import users from '../lib/users'
import sysinfo from '../sysinfo.json'
import pck from '../../package.json'
import { nodeEnv } from '@tasenor/common-node'
const router = express.Router()

/**
 * Get the readiness status of the application.
 */
router.get('/',
  async (req, res) => {
    const status = sysinfo[nodeEnv()]
    status.hasAdminUser = await users.hasAdminUser()
    status.version = pck.version
    res.send(status)
  }
)

export default router
