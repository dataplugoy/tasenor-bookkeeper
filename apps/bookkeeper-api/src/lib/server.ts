import { log, error, REFRESH_TOKEN_EXPIRY_TIME, MINUTES, YEARS, UUID, Token, Url, LocalUrl, NormalTokenPayload, netConfigure, POST, netRefresh } from '@tasenor/common'
import { JwtPayload } from 'jsonwebtoken'
import { DB, tokens, vault, createUuid, isDevelopment, killPortUser } from '@tasenor/common-node'
import killable from 'killable'
import path from 'path'
import fs from 'fs'
import knex from './knex'
import system from './system'
import './plugins'
import wtf from 'wtfnode'
import cron from './cron'

let server

/**
 * Register running server.
 * @param s
 */
function setServer(s) {
  server = killable(s)
}

/**
 * Kill the current server.
 */
async function kill() {
  log('Shutting down the server.')
  await knex.disconnect()
  await DB.disconnectAll()
  cron.stop()
  server.kill()
  wtf.dump()
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
  const token: Token = vault.get('TASENOR_SITE_TOKEN', '') as Token
  let parsed: JwtPayload | null = null
  if (token) {
    parsed = tokens.parse(process.env.TASENOR_SITE_TOKEN as Token) as JwtPayload
    if (!parsed) {
      throw new Error('Cannot parse TASENOR_SITE_TOKEN.')
    }
    if (parsed.payload.exp - new Date().getTime() / 1000 < 0) {
      throw new Error(`The TASENOR_SITE_TOKEN has been expired ${new Date(parsed.payload.exp * 1000)}.`)
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
    netConfigure({
      baseUrl,
      sites: {
        [baseUrl]: {
          uuid,
          refreshToken: token,
          refreshUrl: '/api/v1/auth/refresh' as LocalUrl
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
  netConfigure({
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
    log('Regular token refresh for Tasenor API.')
    await netRefresh(process.env.TASENOR_API_URL as Url)
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
  const res = await POST('/sites' as LocalUrl)
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
