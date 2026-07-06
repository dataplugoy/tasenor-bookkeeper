import { log, YEARS, UUID, Url, NormalTokenPayload, netConfigure } from '@tasenor/common'
import { DB, tokens, vault, createUuid, isDevelopment, killListener } from '@tasenor/common-node'
import path from 'path'
import fs from 'fs'
import knex from './knex'
import system from './system'
import './plugins'
import cron from './cron'

/**
 * Kill the current server.
 */
async function kill() {
  log('Shutting down the server.')
  cron.stop()
  killListener()
  await knex.disconnect()
  await DB.disconnectAll()
  setTimeout(() => process.kill(process.ppid, 'SIGTERM'), 500)
}

/**
 * Perform setup tasks for the server.
 */
async function initialize() {
  log('Initializing the server...')

  // Reuse old token to make development easier.
  if (isDevelopment()) {
    loadState()
  }

  // Recreate UUID every boot.
  const uuid: UUID = createUuid()
  log(`Setting uuid to ${uuid.replace(/.{12}$/, 'XXXXXXXXXXXX')}`)
  await system.set('uuid', uuid as UUID)

  // Configure net for the local site only.
  const localUrl: Url = `http://localhost:${process.env.PORT}` as Url
  const localToken: NormalTokenPayload = {
    owner: 'root@localhost',
    feats: { ADMIN: true },
    plugins: []
  }
  netConfigure({
    sites: {
      [localUrl]: {
        token: await tokens.sign(localToken, 'internal', 2 * YEARS)
      }
    }
  })

  // Ensure minimal settings.
  if (!await system.get('siteUrl')) {
    log(`Setting siteUrl to ${localUrl}`)
    await system.set('siteUrl', localUrl)
  }
}

/**
 * Store current server state to the disk.
 */
function saveState(state) {
  const statePath = path.join(__dirname, '..', '..', '.state')
  log(`Saving state to ${statePath}`)
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n')
}

/**
 * Load or construct the current state if no earlier state saved.
 */
function loadState() {
  const statePath = path.join(__dirname, '..', '..', '.state')
  if (fs.existsSync(statePath)) {
    log(`Loading state from ${statePath}`)
    const { privateSecret } = JSON.parse(fs.readFileSync(statePath).toString('utf-8'))
    vault.setPrivateSecret(privateSecret)
  } else {
    const privateSecret = vault.getPrivateSecret()
    saveState({ privateSecret })
  }
}

export default {
  initialize,
  kill,
}
