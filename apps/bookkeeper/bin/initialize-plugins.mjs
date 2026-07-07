#!/usr/bin/env node
import path from 'path'
import { fileURLToPath } from 'url'
import common from '@tasenor/common'
import commonNode from '@tasenor/common-node'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_PATH = path.join(__dirname, '..', 'src', 'Plugins')

// Plugins are a permanent, bundled part of the repository. This script only (re)generates
// the local `index.json` catalog and the `index.jsx` UI barrel by scanning the bundled
// plugins. There is no fetching, cloning or installing of external plugin repositories.
async function main() {
  commonNode.plugins.setConfig('PLUGIN_PATH', SRC_PATH)
  common.log(`Generating bundled plugin index in ${SRC_PATH}...`)
  const plugins = await commonNode.plugins.updatePluginList()
  commonNode.plugins.savePluginIndexJsx(plugins)
}

main().then(() => process.exit()).catch(err => { common.error(err); process.exit(-1) })
