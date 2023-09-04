import { tasenorInitialStack, tasenorStack, tasenorFinalStack } from '@tasenor/common-node'
import path from 'path'
import express from 'express'
import { Url, log } from '@tasenor/common'

import { initialize, middleware } from '../src/plugin-server/ui-plugin-middleware'

async function main() {
  await initialize()

  const app = express()
  const DIST_DIR = path.join(__dirname, '..', 'dist')
  const HTML_FILE = path.join(DIST_DIR, 'index.html')
  app.use(tasenorInitialStack({ origin: process.env.UI_ORIGIN_URL as Url, api: process.env.UI_API_URL as Url }))
  app.use(...tasenorStack({ url: true, json: true, token: true }))
  app.use('/internal/plugins', middleware)
  app.use(express.static(DIST_DIR))
  app.get('*', (req, res) => {
    res.sendFile(HTML_FILE)
  })
  app.use(tasenorFinalStack())

  const PORT = process.env.PORT || 3102
  app.listen(PORT, () => {
    log(`Production Bookkeeper listening to ${PORT}.`)
    log('Press Ctrl+C to quit.')
  })
}

(async () => {
  main()
})()
