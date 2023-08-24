#!/usr/bin/env -S npx tsx
import common from '@tasenor/common'
import commonNode from '@tasenor/common-node'
const { net, log, mute, unmute, warning, waitPromise } = common
const { vault, plugins } = commonNode
const { setConfig, sortPlugins } = plugins

/**
 * Check that TASENOR_SITE_TOKEN token is set and configure net if it is.
 * @param url
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
 * @param api
 * @returns
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
    const [, , cmd, arg] = process.argv
    switch (cmd) {
      case 'ls':
        checkErpToken(arg)
        return listPlugins(arg)
      default:
        throw new Error(`Cannot handle unknown command ${cmd}`)
    }
  }
}

main().catch(err => { console.error(`${process.argv.join(' ')}: Error exit: ${err}`); process.exit(-1) }).then(() => process.exit())
