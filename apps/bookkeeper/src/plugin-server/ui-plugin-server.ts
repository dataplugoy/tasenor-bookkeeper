/**
 * This should be really a Vite plugin, but since at the time of writing
 * Vite config together with Turborepo really sucks, it cannot be done.
 * No package from local can be really imported.
 */
import fs from 'fs'
import path from 'path'
import express from 'express'
import pkg from '../../package.json' assert { type: 'json' }
import { error, warning, net, log, REFRESH_TOKEN_EXPIRY_TIME, MINUTES, LocalUrl, Token, Url, TasenorPlugin } from '@tasenor/common'
import { vault, plugins, systemPiped } from '@tasenor/common-node'
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
  const current: Record<string, Partial<TasenorPlugin>> = {}
  let localId = -1

  // Start from the backend list.
  const plugins = await net.GET(`${process.env.API_URL}/plugins` as Url)
  if (!plugins.success) {
    warning('Failed to fetch plugin update from backend.')
  } else {
    for (const plugin of plugins.data as unknown as Partial<TasenorPlugin>[]) {
      current[plugin.code || ''] = plugin
      localId = Math.min(localId, (plugin.id || 0) - 1)
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
      if (!current[plugin.code]) {
        warning(`A plugin '${plugin.code}' not found from API listing.`)
      } else if (plugin.version !== current[plugin.code].version) {
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
  const scanned: TasenorPlugin[] = Object.values(current) as TasenorPlugin[]
  if (!samePlugins(oldIndex, scanned)) {
    savePluginIndex(scanned)
    savePluginIndexJsx(scanned)
  }

  return scanned
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
 * Install the given version of the plugin.
 * @param {String} auth Authorization header to use.
 * @param {String} code
 * @param {String} version
 */
async function install(auth, code, version) {
  const index = loadPluginIndex()
  const plugin = findPluginFromIndex(code, index)
  if (!plugin) {
    return 'Cannot find plugin with the given code.'
  }
  if (!plugin.path) {
    return 'Cannot install plugin that has no copy in UI server.'
  }
  if (plugin.availableVersion !== version) {
    return 'The given version of the plugin is not available.'
  }

  // Mark install to UI.
  savePluginState(plugin, { ...loadPluginState(plugin), installed: true })

  // Mark install to backend.
  const res = await net.POST(`${process.env.API_URL}/plugins` as Url, { code, version }, { Authorization: auth })
  if (!res.success) {
    return 'Installing plugin on backend failed.'
  }

  plugin.installedVersion = version
  savePluginIndexJsx(updatePluginIndex(plugin, index))

  return plugin
}

/**
 * Ininstall the given plugin.
 * @param {String} auth Authorization header to use.
 * @param {String} code
 * @param {Boolean} ignoreError If set, ignore backend failure.
 */
async function uninstall(auth, code, ignoreError = false) {
  const index = loadPluginIndex()
  const plugin = findPluginFromIndex(code, index)
  if (!plugin) {
    return 'Cannot find plugin with the given code.'
  }
  if (!plugin.installedVersion) {
    return 'Plugin is not installed.'
  }

  // Mark uninstall to backend.
  const res = await net.DELETE(`${process.env.API_URL}/plugins` as Url, { code }, { Authorization: auth })
  if (!res.success && !ignoreError) {
    return 'Uninstalling plugin on backend failed.'
  }

  // Mark uninstall to UI.
  savePluginState(plugin, { ...loadPluginState(plugin), installed: false })

  plugin.installedVersion = undefined
  savePluginIndexJsx(updatePluginIndex(plugin, index))

  return plugin
}

/**
 * Rebuild client.
 */
async function rebuild() {
  await systemPiped('pnpm build')
}

/**
 * Remove all plugins and start from the scratch.
 */
async function reset(auth) {
  await net.GET(`${process.env.API_URL}/plugins/reset` as Url, null, { Authorization: auth })
  for (const plugin of await loadPluginIndex()) {
    if (isInstalled(plugin)) {
      await uninstall(auth, plugin.code, true)
    }
  }
  await updateLocalPluginList()
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
    return res.status(401).send({ message: 'Authentication token missing.' })
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
    } else if (req.method === 'POST') {
      log(`Installing ${req.body.code} version ${req.body.version}.`)
      const data = await install(auth, req.body.code, req.body.version).catch(next)
      return respond(res, data)
    } else if (req.method === 'DELETE') {
      log(`Uninstalling ${req.body.code}.`)
      const data = await uninstall(auth, req.body.code).catch(next)
      return respond(res, data)
    } else {
      return res.status(405).send({ message: 'Method not allowed.' })
    }
  } else if (req.path === '/reset') {
    if (req.method === 'GET') {
      log('Full plugin reset requested.')
      await reset(auth).catch(next)
      return res.status(200).send({ message: 'Reset successful.' })
    } else {
      return res.status(405).send({ message: 'Method not allowed.' })
    }
  } else if (req.path === '/rebuild') {
    if (req.method === 'GET') {
      log('Plugin rebuild requested.')
      net.GET(`${process.env.API_URL}/plugins/rebuild` as Url, null, { Authorization: auth }) // No await. Run parallel.
      await rebuild().catch(next)
      const plugins = await updateLocalPluginList().catch(next)
      res.send(plugins)
    } else {
      return res.status(405).send({ message: 'Method not allowed.' })
    }
  }
  return res.status(404).send({ message: 'Path not found.' })
}

async function main() {
  log(`Starting UI plugin server v${pkg.version}`)

  await initialize()

  const app = express()
  app.use(express.json())
  app.use('/internal/plugins', middleware)

  const port = parseInt(process.env.PORT || '7204') + 2
  log(`UI plugin server listening on port ${port}`)
  await app.listen(port)
}

main().catch(err => { console.error(err); process.exit(-1) })
