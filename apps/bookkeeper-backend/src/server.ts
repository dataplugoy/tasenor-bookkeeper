import path from 'path'
import express from 'express'
import config from './config'
import { log, Url, DirectoryPath, setServerRoot } from '@dataplug/tasenor-common'
import { vault, tasenorInitialStack, tasenorFinalStack, plugins, GitRepo } from '@dataplug/tasenor-common-node'
import server from './lib/server'
import catalog from './lib/catalog'
import cron from './lib/cron'
import pkg from '../package.json'

// List of plugin URLs to install by default.
const INITIAL_PLUGIN_REPOS = process.env.INITIAL_PLUGIN_REPOS ? process.env.INITIAL_PLUGIN_REPOS.split(' ') : []

const app = express()

async function main() {
  log(`Starting server v${pkg.version}`)
  setServerRoot(path.join(__dirname, '..'))
  await vault.initialize()
  await server.initialize()
  app.use(tasenorInitialStack({ origin: process.env.UI_ORIGIN_URL as Url }))
  app.use(express.static('doc'))
  app.use('/', require('./routes/index').default)
  app.use(tasenorFinalStack())

  const listener = app.listen(config.PORT, async function () {
    server.register()
    log('Checking default plugin repos...')
    for (const repo of INITIAL_PLUGIN_REPOS) {
      log(`Checking plugin repo ${repo}.`)
      await GitRepo.get(repo as Url, plugins.getConfig('PLUGIN_PATH') as DirectoryPath)
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
