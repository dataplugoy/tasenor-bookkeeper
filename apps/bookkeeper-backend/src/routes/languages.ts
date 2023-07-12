import { Language } from '@dataplug/tasenor-common'
import express from 'express'
import catalog from '../lib/catalog'

const router = express.Router()

router.get('/:lang',
  async (req, res) => {
    res.send(catalog.getTranslations(req.params.lang as Language))
  }
)

export default router
