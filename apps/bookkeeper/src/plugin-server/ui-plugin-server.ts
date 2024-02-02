/**
 * This should be really a Vite plugin, but since at the time of writing
 * Vite config together with Turborepo really sucks, it cannot be done.
 * No package from local can be really imported.
 */
import express from 'express'
import pkg from '../../package.json' assert { type: 'json' }
import { log } from '@tasenor/common'
import { initialize, middleware } from './ui-plugin-middleware'
import { listen } from '@tasenor/common-node'

async function main() {
  log(`Starting UI plugin server v${pkg.version}`)

  await initialize()

  const app = express()
  app.use(express.json())
  app.use('/internal/plugins', middleware)

  const port = parseInt(process.env.PORT || '7204') + 2

  listen(app, port, () => log(`UI plugin server listening on port ${port}`))
}

main().catch(err => { console.error(err); process.exit(-1) })
