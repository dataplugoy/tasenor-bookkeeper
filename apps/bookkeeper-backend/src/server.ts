import fs from 'fs'
import path from 'path'
import express from 'express'
import config from './config'
import { log, Url, DirectoryPath, setServerRoot, error } from '@tasenor/common'
import { vault, tasenorInitialStack, tasenorFinalStack, plugins, GitRepo, system } from '@tasenor/common-node'
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
  app.use(express.static('doc'))
  app.use('/', routes)
  app.use(tasenorFinalStack())

  const listener = app.listen(config.PORT, async function () {
    server.register()

    log('Checking default plugin repos...')
    let changes = false
    for (const repo of INITIAL_PLUGIN_REPOS) {
      log(`Checking plugin repo ${repo}.`)
      if (repo.startsWith('file://')) {
        const src = path.join(__dirname, '..', '..', '..', repo.substring(7))
        const dst = path.join(plugins.getConfig('PLUGIN_PATH'), path.basename(repo))
        if (fs.existsSync(src)) {
          if (!fs.existsSync(dst)) {
            const cmd = `ln -sf "${src}" "${dst}"`
            await system(cmd)
            changes = true
          }
        } else {
          error(`A plugin repository ${repo} not found.`)
        }
      } else {
        const dst = path.join(plugins.getConfig('PLUGIN_PATH'), path.basename(repo).replace(/\.git$/, ''))
        if (!fs.existsSync(dst)) {
          await GitRepo.get(repo as Url, plugins.getConfig('PLUGIN_PATH') as DirectoryPath)
          changes = true
        }
      }
    }

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
