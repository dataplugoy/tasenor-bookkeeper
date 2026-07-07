import path from 'path'
import express, { Express } from 'express'
import config from './config'
import { log, Url, setServerRoot } from '@tasenor/common'
import { vault, tasenorInitialStack, tasenorFinalStack, plugins, listen } from '@tasenor/common-node'
import './lib/plugins' // Side effect: configures PLUGIN_PATH for the bundled plugins.
import db from './lib/db'
import server from './lib/server'
import catalog from './lib/catalog'
import cron from './lib/cron'
import pkg from '../package.json'
import routes from './routes'

async function main() {
  log('Building bundled plugin index...')
  await plugins.updatePluginList()

  await catalog.reload()

  cron.initialize()
  log('Bookkeeper back-end server listening on port ' + config.PORT)
}

async function launch() {
  log(`Starting server v${pkg.version}`)

  const app: Express = express()
  setServerRoot(path.join(__dirname, '..'))
  await vault.initialize()
  await db.migrate()
  await server.initialize()
  app.use(tasenorInitialStack({ origin: process.env.UI_ORIGIN_URL as Url }))
  app.use('/', routes)
  app.use(tasenorFinalStack())
  listen(app, config.PORT, main)
}

(async () => {
  launch()
})()
