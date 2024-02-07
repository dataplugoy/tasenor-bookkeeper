#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import common from '@tasenor/common'
import commonNode from '@tasenor/common-node'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_PATH = path.join(__dirname, '..', 'src', 'Plugins')

function check(fileName, content) {
  const filePath = path.join(SRC_PATH, fileName)
  if (fs.existsSync(filePath)) {
    common.log(`  Found ${fileName}`)
  } else {
    fs.writeFileSync(filePath, content)
    common.log(`  Created ${fileName}`)
  }
}

async function main() {
  if (!fs.existsSync(SRC_PATH)) {
    common.log(`Creating ${SRC_PATH}...`)
    fs.mkdirSync(SRC_PATH)
  }

  const src = path.join(__dirname, '..', '..', '..')
  commonNode.plugins.setConfig('PLUGIN_PATH', SRC_PATH)
  commonNode.plugins.setConfig('INITIAL_PLUGIN_REPOS', process.env.INITIAL_PLUGIN_REPOS || '')
  await commonNode.plugins.fetchRepositories(src)

  common.log(`Checking ${SRC_PATH} for initial files...`)
  check('index.json', '[]\n')
  check('index.jsx', 'const index = []\n\nexport default index\n')
}

main().then(() => process.exit()).catch(err => { common.error(err); process.exit(-1) })
