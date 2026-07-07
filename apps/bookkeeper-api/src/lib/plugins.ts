import fs from 'fs'
import path from 'path'
import { plugins } from '@tasenor/common-node'
import { LoginPluginData, PricingModel, log } from '@tasenor/common'

const { setConfig } = plugins

const pluginPath = path.join(__dirname, '..', 'plugins')
log(`Setting PLUGIN_PATH to '${pluginPath}'.`)
setConfig('PLUGIN_PATH', pluginPath)

if (!fs.existsSync(pluginPath)) {
  log(`Creating plugin path '${pluginPath}'.`)
  fs.mkdirSync(pluginPath)
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
  defaultLoginData
}
