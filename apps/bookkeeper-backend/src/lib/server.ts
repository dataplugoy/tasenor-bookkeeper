import { log, net, error, REFRESH_TOKEN_EXPIRY_TIME, MINUTES, YEARS, UUID, Token, Url, LocalUrl, NormalTokenPayload } from '@dataplug/tasenor-common'
import { DB, tokens, vault, createUuid, isDevelopment } from '@dataplug/tasenor-common-node'
import killable from 'killable'
import path from 'path'
import fs from 'fs'
import knex from './knex'
import system from './system'
import './plugins'

let server

/**
 * Register running server.
 * @param s
 */
function setServer(s) {
  killable(s)
  server = s
}

/**
 * Kill the current server.
 */
async function kill() {
  log('Shutting down the server.')
  await knex.disconnect()
  await DB.disconnectAll()
  server.kill()
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

  // Check token.
  const token: Token = vault.get('ERP_SITE_TOKEN', '') as Token
  let parsed: Record<string, any> | undefined
  if (token) {
    parsed = tokens.parse(process.env.ERP_SITE_TOKEN as Token)
    if (!parsed) {
      throw new Error('Cannot parse ERP_SITE_TOKEN.')
    }
    if (parsed.payload.exp - new Date().getTime() / 1000 < 0) {
      throw new Error(`The ERP_SITE_TOKEN has been expired ${new Date(parsed.payload.exp * 1000)}.`)
    }
  }

  // Recreate UUID every boot.
  const uuid: UUID = createUuid()
  log(`Setting uuid to ${uuid.replace(/.{12}$/, 'XXXXXXXXXXXX')}`)
  await system.set('uuid', uuid as UUID)

  // Configure net.
  // Check API URL.
  const baseUrl: Url = process.env.TASENOR_API_URL as Url
  if (baseUrl) {
    net.configure({
      baseUrl,
      sites: {
        [baseUrl]: {
          uuid,
          refreshToken: token,
          refreshUrl: '/auth/refresh' as LocalUrl
        }
      }
    })
  }

  const localUrl: Url = `http://localhost:${process.env.PORT}` as Url
  const localToken: NormalTokenPayload = {
    owner: 'root@localhost',
    feats: { ADMIN: true },
    plugins: []
  }
  net.configure({
    sites: {
      [localUrl]: {
        token: await tokens.sign(localToken, 'internal', 2 * YEARS)
      }
    }
  })

  // Ensure minimal settings.
  if (!await system.get('siteUrl')) {
    const siteUrl = parsed ? parsed.payload.data.owner : localUrl
    log(`Setting siteUrl to ${siteUrl}`)
    await system.set('siteUrl', siteUrl)
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

/**
 * Function to refresh tokens on regular interval.
 */
let refreshing
async function refreshTokens(): Promise<void> {
  if (!process.env.TASENOR_API_URL) {
    return
  }
  if (!refreshing) {
    refreshing = true
    log('Regular token refresh for ERP API.')
    await net.refresh(process.env.TASENOR_API_URL as Url)
    refreshing = false
  }
}

/**
 * Register this server to the Tasenor Master if environment set.
 */
async function register(): Promise<void> {
  if (!process.env.TASENOR_API_URL) {
    return
  }
  log('Site token found and it looks valid. Trying to register...')
  const res = await net.POST('/sites' as LocalUrl)
  if (!res.success) {
    error('Site registration failed. Exiting.')
    process.exit(1)
  }
  log('Successfully registered the site.')
  const interval = REFRESH_TOKEN_EXPIRY_TIME - 1 * MINUTES
  setInterval(() => refreshTokens(), interval * 1000)
}

export default {
  initialize,
  kill,
  register,
  setServer
}
