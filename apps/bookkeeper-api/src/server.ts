import path from 'path'
import express from 'express'
import config from './config'
import { log, Url, DirectoryPath, setServerRoot } from '@tasenor/common'
import { vault, tasenorInitialStack, tasenorFinalStack, plugins } from '@tasenor/common-node'
import db from './lib/db'
import server from './lib/server'
import catalog from './lib/catalog'
import cron from './lib/cron'
import pkg from '../package.json'
import routes from './routes'

// List of plugin URLs to install by default.
const INITIAL_PLUGIN_REPOS = process.env.INITIAL_PLUGIN_REPOS ? process.env.INITIAL_PLUGIN_REPOS.split(' ') : []

const app = express()

async function main() {
  log(`Starting server v${pkg.version}`)
  setServerRoot(path.join(__dirname, '..'))
  await vault.initialize()
  await db.migrate()
  await server.initialize()
  app.use(tasenorInitialStack({ origin: process.env.UI_ORIGIN_URL as Url }))
  app.use('/', routes)
  app.use(tasenorFinalStack())

  const listener = app.listen(config.PORT, async function () {
    server.register()

    log('Checking default plugin repos...')
    const src = path.join(__dirname, '..', '..', '..') as DirectoryPath
    const changes = await plugins.updateRepositories(INITIAL_PLUGIN_REPOS, src, plugins.getConfig('PLUGIN_PATH') as DirectoryPath)

    // Rebuild plugin index if changes.
    if (changes) {
      await plugins.updatePluginList()
    }

    await catalog.reload()

    cron.initialize()
    log('Bookkeeper back-end server listening on port ' + config.PORT)
  })

  server.setServer(listener)
}

(async () => {
  main()
})()
