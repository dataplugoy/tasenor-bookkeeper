import path from 'path'
import express from 'express'
import config from './config'
import { log, Url, DirectoryPath, setServerRoot, error, waitPromise } from '@tasenor/common'
import { vault, tasenorInitialStack, tasenorFinalStack, plugins, killPortUser } from '@tasenor/common-node'
import db from './lib/db'
import server from './lib/server'
import catalog from './lib/catalog'
import cron from './lib/cron'
import pkg from '../package.json'
import routes from './routes'

const app = express()

/**
 * Try to establish a listener for the server port.
 */
async function listener(): Promise<boolean> {
  return new Promise((resolve) => {
    log('Setting up listener...')

    const listener = app.listen(config.PORT,
    ).on('error', (err) => {
      error('Launching failed:', err + '')
      if ('code' in err && err.code === 'EADDRINUSE') {
        error('Trying to kill existing process...')
        killPortUser(config.PORT)
      }
      resolve(false)
    }).on('listening', async () => {
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
      resolve(true)
    })
  })
}

async function main() {
  log(`Starting server v${pkg.version}`)
  setServerRoot(path.join(__dirname, '..'))
  await vault.initialize()
  await db.migrate()
  await server.initialize()
  app.use(tasenorInitialStack({ origin: process.env.UI_ORIGIN_URL as Url }))
  app.use('/', routes)
  app.use(tasenorFinalStack())

  while (true) {
    if (await listener()) break
    await waitPromise(2000)
  }
}

(async () => {
  main()
})()
