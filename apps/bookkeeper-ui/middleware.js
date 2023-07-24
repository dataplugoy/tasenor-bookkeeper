import path from 'path'
import { net } from '../../packages/tasenor-common/dist/net/net'
import { error, log, warning } from '../../packages/tasenor-common/dist/logging'
import { plugins } from '../../packages/tasenor-common-node/dist/plugins/plugins'
const { getConfig, findPluginFromIndex, setConfig, loadPluginIndex, savePluginIndex, samePlugins, sortPlugins, scanPlugins, isInstalled, loadPluginState, savePluginState, updatePluginIndex } = plugins

/**
 * Combine the latest plugin list from the backend with the locally found data.
 * @returns Object[]
 */
async function updateLocalPluginList() {
  let current = {}
  let localId = -1

  // Start from the backend list.
  const plugins = await net.GET(`${process.env.API_URL}/plugins`)
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
  const old = loadPluginIndex()
  current = Object.values(current)
  if (!samePlugins(old, current)) {
    savePluginIndex(current)
    // savePluginIndexJsx(current)
  }

  return current
}

async function initialize() {
  net.configure({
    sites: {
      [`${process.env.TASENOR_API_URL}`]: {
        refreshUrl: '/auth/refresh/ui',
        refreshToken: process.env.ERP_SITE_TOKEN
      },
      [`${process.env.API_URL}`]: {
        refreshUrl: '/auth/refresh/ui',
        refreshToken: process.env.API_SITE_TOKEN
      }
    }
  })
  const pluginPath = path.join(__dirname, 'src', 'Plugins')
  setConfig('PLUGIN_PATH', pluginPath)
  log(`Updating local plugin list on ${pluginPath}.`)
  await updateLocalPluginList()
  log('Plugin middleware initialized.')
}

export default {
  initialize,
  // middleware
}
