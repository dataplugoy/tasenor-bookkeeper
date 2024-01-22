import fs from 'fs'
import path from 'path'
import { plugins } from '@tasenor/common-node'
import { LoginPluginData, PricingModel, log } from '@tasenor/common'

const { isInstalled, loadPluginIndex, findPluginFromIndex, setConfig, loadPluginState, savePluginState, updatePluginIndex } = plugins

const pluginPath = path.join(__dirname, '..', 'plugins')
log(`Setting PLUGIN_PATH to '${pluginPath}'.`)
setConfig('PLUGIN_PATH', pluginPath)
log(`Setting INITIAL_PLUGIN_REPOS to '${process.env.INITIAL_PLUGIN_REPOS || ''}'.`)
setConfig('INITIAL_PLUGIN_REPOS', process.env.INITIAL_PLUGIN_REPOS || '')

if (!fs.existsSync(pluginPath)) {
  log(`Creating plugin path '${pluginPath}'.`)
  fs.mkdirSync(pluginPath)
}

/**
 * Install plugin.
 * @param code
 * @param version
 * @returns
 */
export function install(code, version): string | undefined {
  const index = loadPluginIndex()
  const plugin = findPluginFromIndex(code, index)
  if (!plugin) {
    return 'Cannot find plugin with the given code.'
  }
  if (plugin.availableVersion !== version) {
    return `There is no version ${version} of the plugin ${code} (found ${plugin.availableVersion} instead).`
  }

  log(`Installing plugin ${code} versio ${version}.`)
  savePluginState(plugin, { ...loadPluginState(plugin), installed: true })

  plugin.installedVersion = version

  updatePluginIndex(plugin, index)
}

/**
 * Remove plugin.
 * @param code
 */
export async function uninstall(code) {
  const index = loadPluginIndex()
  const plugin = findPluginFromIndex(code, index)
  if (!plugin) {
    return 'Cannot find plugin with the given code.'
  }
  log(`Uninstalling plugin ${code}.`)
  savePluginState(plugin, { ...loadPluginState(plugin), installed: false })

  plugin.installedVersion = undefined

  updatePluginIndex(plugin, index)
}

/**
 * Remove all plugin.
 */
export async function reset() {
  for (const plugin of await loadPluginIndex()) {
    if (isInstalled(plugin)) {
      await uninstall(plugin.code)
    }
  }
}

/**
 * Generate subscription data.
 */
export function defaultLoginData(ids: number[], idsAvailable: number[]): LoginPluginData {
  return {
    plugins: ids,
    prices: idsAvailable.map(id => ({ pluginId: id, model: 'FREE' as PricingModel, price: null })),
    subscriptions: ids.map(id => ({
      model: 'FREE' as PricingModel,
      price: null,
      billable: new Date('2123-06-01T00:00:00Z'),
      expires: new Date('2123-06-01T00:00:00Z'),
      pluginId: id
    }))
  }
}

export default {
  install,
  reset,
  uninstall,
  defaultLoginData
}
