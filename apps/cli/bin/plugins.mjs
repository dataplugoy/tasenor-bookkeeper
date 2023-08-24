#!/usr/bin/env -S npx tsx
import path from 'path'
import common from '@tasenor/common'
import commonNode from '@tasenor/common-node'

const { net, log, error, mute, unmute, warning, waitPromise } = common
const { vault, plugins } = commonNode
const { setConfig, sortPlugins } = plugins

/**
 * Check that TASENOR_SITE_TOKEN token is set and configure net if it is.
 */
function checkErpToken(url) {
  if (!process.env.TASENOR_SITE_TOKEN) {
    throw new Error('Environment TASENOR_SITE_TOKEN is not set.')
  }
  if (!url) {
    throw new Error('Need URL.')
  }
  const origin = new URL(url).origin
  net.configure({
    sites: {
      [origin]: {
        refreshToken: process.env.TASENOR_SITE_TOKEN,
        refreshUrl: '/auth/refresh/ui'
      }
    }
  })
}

/**
 * Ask plugin list from API.
 */
async function getPlugins(api) {
  mute()
  let plugins = await net.GET(`${api}/plugins`)
  // Since this is used in deployment scripts, let us wait for the system to get up if we get 502.
  if (!plugins.success) {
    unmute()
    warning(`Call to list plugins from ${api} failed. Status was ${plugins.status}, so let us wait a bit...`)
    mute()
    for (const sec of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 60]) {
      await waitPromise(sec * 1000)
      plugins = await net.GET(`${api}/plugins`)
      if (plugins.success) break
    }
    if (!plugins.success) throw new Error('Failed to fetch plugins.')
  }
  unmute()
  return plugins.data
}

/**
 * Display plugin list from API.
 * @param api
 */
async function listPlugins(api) {
  const data = await getPlugins(api)
  console.dir(sortPlugins(data), { depth: null })
}

/**
 * Handle publishing of plugin from the given directory.
 */
async function publishPlugins(dir ,api) {
  // Collect existing plugins.
  const oldPlugins = {}
  for (const plugin of await getPlugins(api)) {
    oldPlugins[plugin.code] = plugin
  }

  // Scan all and publish plugins that does not exist yet on remote.
  setConfig('PLUGIN_PATH', path.resolve(dir))
  const data = plugins.scanPlugins()

  // Handle publishing.
  process.env.VAULT_URL = 'env://'
  process.env.TASENOR_API_URL = api
  await vault.initialize()

  for (const plugin of data) {
    if (oldPlugins[plugin.code]) {
      warning(`Skipping ${plugin.code} v${plugin.version}`)
      continue
    }
    log(`Publishing ${plugin.code} v${plugin.version}`)
    const { code, title, description, icon, use, type } = plugin
    const res = await net.POST(`${api}/plugins/publish`, { code, title, description, icon, use, type })
    if (res === undefined) {
      error(`Publishing ${plugin.code} failed.`)
    }
  }
}

/**
 * Display usage.
 */
function usage() {
  console.log(`${process.argv[1]} ls <url>|publish <dir> <url>|release-patch <dir>`)
}

/**
 * Main program.
 */
async function main() {
  if (process.argv.length < 3) {
    usage()
  } else {
    const [, , cmd, arg, arg2] = process.argv
    switch (cmd) {
      case 'ls':
        checkErpToken(arg)
        return listPlugins(arg)
      case 'publish':
        checkErpToken(arg2)
        return publishPlugins(arg, arg2)
      default:
        throw new Error(`Cannot handle unknown command ${cmd}`)
    }
  }
}

main().catch(err => { console.error(`${process.argv.join(' ')}:\n`, err); process.exit(-1) }).then(() => process.exit())
