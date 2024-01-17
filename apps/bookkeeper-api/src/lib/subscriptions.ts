import { PluginCode, error } from '@tasenor/common'
import { Response } from 'express'
import catalog from './catalog'

/**
 * Check if the request contains valid subscription to the plugin and return reason if not.
 */
export function verifySubscription(res: Response, code: PluginCode): string | true {
  if (res.locals && res.locals.plugins) {
    const plugin = catalog.find(code)
    if (plugin) {
      if (res.locals.plugins.includes(plugin.id)) {
        return true
      }
      return `Needed plugin ID ${plugin.id} but had only ${JSON.stringify(res.locals.plugins)}.`
    } else {
      return 'Cannot find the plugin from the catalog.'
    }
  } else {
    return 'No plugins set in the request.'
  }
}

/**
 * Check if the request contains valid subscription to the plugin.
 */
export function hasSubscription(res: Response, code: PluginCode): boolean {
  return verifySubscription(res, code) === true
}

/**
 * Check if the request contains valid subscription to the plugin and log error if not.
 * Also returns response already set, if check fails.
 */
export function checkSubscription(res: Response, code: PluginCode): Response | null {
  const reason = verifySubscription(res, code)
  if (reason === true) {
    return null
  }
  error(`Permission denied to plugin ${code}: ${reason}`)
  return res.status(403).send({ message: 'No subscription to the plugin.' })
}
