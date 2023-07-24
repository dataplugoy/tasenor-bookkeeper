#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC_PATH = path.join(__dirname, '..', 'src', 'Plugins')

// Borrowed from tasenor-common-node
async function systemPiped(command, quiet = false, ignoreError = false) {
  if (!quiet) {
    console.log(`Running system command: ${command}`)
  }
  return new Promise((resolve, reject) => {
    let out = ''
    const proc = spawn(command, { shell: true })
    proc.stdout.on('data', (data) => {
      out += data
      if (!quiet) process.stdout.write(data)
    })

    proc.stderr.on('data', (data) => {
      if (!quiet) process.stderr.write(data)
    })

    proc.on('close', (code) => {
      if (code) {
        if (ignoreError) {
          resolve(null)
        } else {
          reject(new Error(`Call '${command}' failed with code ${code}.`))
        }
      } else {
        resolve(out)
      }
    })
  })
}

// List of plugin URLs to install by default.
const INITIAL_PLUGIN_REPOS = process.env.INITIAL_PLUGIN_REPOS ? process.env.INITIAL_PLUGIN_REPOS.split(' ') : []

function check(fileName, content) {
  const filePath = path.join(SRC_PATH, fileName)
  if (fs.existsSync(filePath)) {
    console.log(`  Found ${fileName}`)
  } else {
    fs.writeFileSync(filePath, content)
    console.log(`  Created ${fileName}`)
  }
}

async function repos() {
  for (const repo of INITIAL_PLUGIN_REPOS) {
    const dst = path.join(SRC_PATH, repo.replace(/.*\//, '').replace('.git', ''))
    if (fs.existsSync(dst)) {
      console.log(`Plugin repo ${repo} already downloaded.`)
    } else {
      console.log(`Fetching plugin repo ${repo} to ${SRC_PATH}.`)
      const cmd = `cd ${SRC_PATH} && git clone "${repo}"`
      await systemPiped(cmd)
    }
  }
}

async function main() {
  if (!fs.existsSync(SRC_PATH)) {
    console.log(`Creating ${SRC_PATH}...`)
    fs.mkdirSync(SRC_PATH)
  }

  await repos()

  console.log(`Checking ${SRC_PATH} for initial files...`)
  check('index.json', '[]\n')
  check('index.jsx', 'const index = []\n\nexport default index\n')
}

main().then(() => process.exit()).catch(err => { console.log(err); process.exit(-1) })
