/**
 * This should be really a Vite plugin, but since at the time of writing
 * Vite config together with Turborepo really sucks, it cannot be done.
 * No package from local can be really imported.
 */
import fs from 'fs'
import path from 'path'
import express from 'express'
import pkg from '../../package.json' assert { type: 'json' }
import { error, warning, net, log, REFRESH_TOKEN_EXPIRY_TIME, MINUTES, LocalUrl, Token, Url, TasenorPlugin } from '@dataplug/tasenor-common'
import { vault, plugins, systemPiped } from '@dataplug/tasenor-common-node'
const { getConfig, findPluginFromIndex, setConfig, loadPluginIndex, savePluginIndex, samePlugins, sortPlugins, scanPlugins, isInstalled, loadPluginState, savePluginState, updatePluginIndex } = plugins

/**
 * Function to refresh tokens on regular interval.
 */
let refreshing
async function refreshTokens() {
  if (!refreshing) {
    refreshing = true
    log('Regular token refresh for Bookkeeper API.')
    await net.refresh(process.env.API_URL as Url)
    refreshing = false
  }
}

// Configure external services we use and internal variables.
async function initialize() {
  await vault.initialize()
  net.configure({
    sites: {
      [`${process.env.API_URL}`]: {
        refreshUrl: '/auth/refresh/ui' as LocalUrl,
        refreshToken: await vault.get('API_SITE_TOKEN') as Token
      }
    }
  })
  const pluginPath = path.join(__dirname, '..', '..', 'src', 'Plugins')
  setConfig('PLUGIN_PATH', pluginPath)
  log('Updating local plugin list.')
  await updateLocalPluginList()
  log('Plugin middleware initialized.')

  const interval = REFRESH_TOKEN_EXPIRY_TIME - 1 * MINUTES
  setInterval(() => refreshTokens(), interval * 1000)
}

/**
 * Combine the latest plugin list from the backend with the locally found data.
 * @returns Object[]
 */
async function updateLocalPluginList() {
  let current = {}
  let localId = -1

  // Start from the backend list.
  const plugins = await net.GET(`${process.env.API_URL}/plugins` as Url)
  if (!plugins.success) {
    warning('Failed to fetch plugin update from backend.')
  } else {
    for (const plugin of plugins.data) {
      current[plugin.code] = plugin
      localId = Math.min(localId, plugin.id - 1)
    }
  }

  // Scan locals and merge.
  for (const plugin of await scanPlugins()) {
    // Check conflicting data.
    if (plugin.use === 'both') {
      if (plugin.installedVersion && !isInstalled(plugin)) {
        error(`An installed plugin ${plugin.code} ${plugin.version} with usage 'both' is installed on back-end but not on ui.`)
        error(`Deleting ${plugin.code} ${plugin.version} from the list.`)
        delete current[plugin.code]
        continue
      }
      if (plugin.version !== current[plugin.code].version) {
        warning(`Conflicting versions for ${plugin.code} in backend ${current[plugin.code].version} and UI ${plugin.version}.`)
      }
    }
    if (!current[plugin.code]) {
      current[plugin.code] = plugin
      current[plugin.code].id = localId--
    }
    current[plugin.code].availableVersion = plugin.version
    current[plugin.code].path = plugin.path
    if (isInstalled(plugin)) {
      current[plugin.code].installedVersion = plugin.version
    }
  }

  // Avoid dev server unnecessary restart.
  const oldIndex = loadPluginIndex()
  const scanned: TasenorPlugin[] = Object.values(current)
  if (!samePlugins(oldIndex, scanned)) {
    savePluginIndex(scanned)
    savePluginIndexJsx(current)
  }

  return current
}

/**
 * Write new `index.jsx` files based on the plugin data.
 * @param plugins
 */
function savePluginIndexJsx(plugins) {
  plugins = sortPlugins(plugins)

  const installed = plugins.filter(p => p.installedVersion && p.use !== 'backend')
  const imports = installed.map(p => `import ${p.code} from '${p.path}/ui'`).join('\n')
  const index = `const index = [
${installed.map(p => '  ' + p.code).join(',\n')}
]
`
  const js = `${imports}

${index}
export default index
`
  fs.writeFileSync(path.join(getConfig('PLUGIN_PATH'), 'index.jsx'), js)
}

/**
 * Helper to pass either error message if string response, 200 on object or 204 status if no message.
 * @param {Response} res
 * @param {String|null} message
 */
function respond(res, message) {
  if (typeof (message) === 'string') {
    res.status(400).send({ message })
  } else if (typeof (message) === 'object') {
    res.setHeader('Content-Type', 'application/json')
    res.send(message)
  } else {
    res.sendStatus(204)
  }
}

/**
 * A middleware handling plugin end-point for UI server.
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
async function middleware(req, res, next) {
  log(req.method + ' ' + req.originalUrl)
  const auth = req.headers.authorization
  if (!auth) {
    // return res.status(401).send({ message: 'Authentication token missing.' })
  }
  // Check something from backend API and see if authorization works as a superuser.
  const testDrive = await net.GET(`${process.env.API_URL}/plugins/auth` as Url, null, { Authorization: auth }).catch(next)
  if (!testDrive) {
    return res.status(403).send({ message: 'Call to the backend failed.' })
  }
  if (!testDrive.success) {
    return res.status(403).send({ message: 'This end point is usable only by superuser.' })
  }
  // Handle request.
  if (req.path === '/') {
    if (req.method === 'GET') {
      let plugins = loadPluginIndex()
      if (plugins.length === 0) {
        await updateLocalPluginList()
        plugins = loadPluginIndex()
      }
      return respond(res, plugins)
    }
  }
  return res.status(404).send({ message: 'Path not found.' })
}

async function main() {
  log(`Starting UI plugin server v${pkg.version}`)

  await initialize()

  const app = express()
  app.use('/internal/plugins', middleware)

  const port = parseInt(process.env.PORT || '7204') + 2
  log(`UI plugin server listening on port ${port}`)
  await app.listen(port)
}

main().catch(err => { console.error(err); process.exit(-1) })
