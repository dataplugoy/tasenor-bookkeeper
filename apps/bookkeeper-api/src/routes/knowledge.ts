import express from 'express'
import catalog from '../lib/catalog'

const router = express.Router()

router.get('/',
  async (req, res) => {
    res.send(await catalog.getCommonKnowledge())
  }
)

export default router
