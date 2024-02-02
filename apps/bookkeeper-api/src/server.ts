import path from 'path'
import express, { Express } from 'express'
import config from './config'
import { log, Url, DirectoryPath, setServerRoot } from '@tasenor/common'
import { vault, tasenorInitialStack, tasenorFinalStack, plugins, listen } from '@tasenor/common-node'
import db from './lib/db'
import server from './lib/server'
import catalog from './lib/catalog'
import cron from './lib/cron'
import pkg from '../package.json'
import routes from './routes'

async function main(listener) {
  server.register()

  log('Checking default plugin repos...')
  const src = path.join(__dirname, '..', '..', '..') as DirectoryPath
  plugins.setConfig('INITIAL_PLUGIN_REPOS', process.env.INITIAL_PLUGIN_REPOS || '')
  const changes = await plugins.fetchRepositories(src)

  // Rebuild plugin index if changes.
  if (changes) {
    await plugins.updatePluginList()
  }

  await catalog.reload()

  cron.initialize()
  log('Bookkeeper back-end server listening on port ' + config.PORT)

  server.setServer(listener)
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
