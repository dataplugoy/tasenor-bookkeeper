import express from 'express'
import catalog from '../lib/catalog'

const router = express.Router()

router.get('/',
  async (req, res, next) => {
    catalog.getCommonKnowledge()
      .then(knowledge => res.send(knowledge))
      .catch(next)
  }
)

export default router
