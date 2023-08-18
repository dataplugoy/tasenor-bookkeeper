#!/usr/bin/env node
import path, { dirname } from 'path'
import fs from 'fs'
import glob from 'glob'
import deepmerge from 'deepmerge'
import { spawn } from 'child_process'
import { ArgumentParser } from 'argparse'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Currently used configuration.
let config = {
  workDir: null,
  buildDir: null,
  outDir: null,
  title: '',
  repositories: {},
}

// Base configuration for Typescript.
const TS_CONFIG = {
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "strictNullChecks": true,
    "moduleResolution": "node",
    "declaration": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "jsx": "react",
    "sourceMap": true
  },
  "include": [
  ]
}

// Base configuration for Typedoc.
const TYPEDOC_CONFIG = {
  "out": null,
  "entryPoints": [],
  "readme": null,
  "name": null,
  "logLevel": "Verbose"
}

/**
 * A logger function.
 * @param args
 */
function log(...args) {
  console.log(new Date(), ...args)
}

/**
 * Collect all file paths matching the file name found, when ascending in the directory structure.
 * @param startDir
 * @param fileName
 */
function pathsFound(startDir, fileName) {
  const filePath = path.join(startDir, fileName)
  let result = []
  if (fs.existsSync(filePath)) {
    result.push(filePath)
  }
  const parentDir = path.dirname(startDir)
  if (parentDir !== startDir) {
    result = result.concat(pathsFound(parentDir, fileName))
  }
  return result.reverse()
}

/**
 * Read the configuration for the project.
 */
function readConfig(dir) {
  let conf = {}
  const confPaths = pathsFound(dir, 'doccer.json')
  if (confPaths.length === 0) {
    throw new Error(`Unable to find configuration 'doccer.json'.`)
  }
  for (const confPath of confPaths) {
    conf = deepmerge(conf, JSON.parse(fs.readFileSync(confPath).toString('utf-8')))
  }
  if (!conf.repositories || !Object.keys(conf.repositories).length) {
    throw new Error(`No documentation repositories defined in any of '${confPaths.join("', '")}'.`)
  }
  conf.workDir = dir
  conf.buildDir = path.join(path.dirname(confPaths.pop()), 'build')
  conf.outDir = path.join(conf.buildDir, 'html')
  if (!fs.existsSync(conf.outDir)) {
    fs.mkdirSync(conf.outDir, { recursive: true })
  }
  config = conf
}

/**
 * Run the shell command.
 * @param command
 */
async function system(command) {
  return new Promise((resolve, reject) => {
    let out = ''
    const proc = spawn(command, { shell: true })
    proc.stdout.on('data', (data) => {
      out += data
      process.stdout.write(data)
    })

    proc.stderr.on('data', (data) => {
      process.stderr.write(data)
    })

    proc.on('close', (code) => {
      if (code) {
        reject(new Error(`Command '${command}' failed with code ${code}.`))
      } else {
        resolve(out)
      }
    })
  })
}

/**
 * Fetch the repository for documentation building.
 * @param name
 */
async function fetch(name) {
  const destDir = path.join(config.buildDir, name)
  if (config.repositories[name].directory) {
    const src = path.resolve(config.repositories[name].directory)
    const dst = `${config.buildDir}/${name}`
    if (!fs.existsSync(dst)) {
      log(`Linking directory ${name} from ${src} to ./build`)
      await system(`ln -sf "${src}" "${dst}"`)
    }
    return
  }
  log(`Fetching repository ${name} to ${config.buildDir}`)
  if (fs.existsSync(destDir)) {
    await system(`cd "${config.buildDir}/${name}" && git pull`)
  } else {
    await system(`cd "${config.buildDir}" && git clone "${config.repositories[name].git}"`)
  }
  log(`Running pnpm install in ${config.buildDir}`)
  await system(`cd "${config.buildDir}/${name}" && pnpm install`)
}

/**
 * Save a json config file.
 * @param filePath
 * @param json
 */
function saveJson(filePath, json) {
  const jsonPath = path.join(config.buildDir, filePath)
  log('Saving', jsonPath)
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2))
}

/**
 * Resolve entry points for a repository.
 */
function repoModules(name, repo) {
  let result = []
  for (const module of repo.modules) {
    log(`Adding ${config.buildDir}/${name}/${module}`);
    const matches = glob.sync(`${config.buildDir}/${name}/${module}`)
    for (let match of matches) {
      match = match.replace(`${config.buildDir}/`, '')
      const filePath = match.replace(`${name}/`, '')
      if (repo.excludes && repo.excludes.includes(filePath)) {
        log(`  [ ${match} SKIPPED ]`)
        continue
      }
      log(`  ${match}`)
      result.push(match)
    }
  }
  return result
}

/**
 * Create configuration for typescript.
 */
async function makeTsConfig() {
  let modules = []
  for (const [name, repo] of Object.entries(config.repositories)) {
    modules = modules.concat(repoModules(name, repo))
  }
  const tsConf = { ...TS_CONFIG, include: modules }
  saveJson('tsconfig.json', tsConf)
}

/**
 * Construct a list of plugins available.
 */
function plugins() {
  const local = glob.sync(path.join(__dirname, '..', 'plugins', '*.js'))
  const installed = ['typedoc-plugin-mermaid']
  return local.concat(installed)
}

/**
 * Create configuration for typedoc.
 */
async function makeTypedocConfig() {
  let entryPoints = []
  for (const [name, repo] of Object.entries(config.repositories)) {
    entryPoints = entryPoints.concat(repoModules(name, repo))
  }
  const typedocConf = { ...TYPEDOC_CONFIG, entryPoints, out: config.outDir }
  const readmes = pathsFound(config.workDir, 'DOCCER-INDEX.md')
  if (readmes.length) {
    typedocConf.readme = readmes.pop()
  }
  typedocConf.name = config.title || 'No Title'
  typedocConf.json = path.join(config.buildDir, 'index.json')
  typedocConf.plugin = plugins()
  saveJson('typedoc.json', typedocConf)
}

/**
 * Run document build command.
 */
async function compile() {
  await system(`cd "${config.buildDir}" && npx typedoc`)
}

/**
 * Dump the configuration on console.
 */
function showConfig() {
  log('Configuration')
  console.dir(config, { depth: null })
}

/**
 * Fetch all repos.
 */
async function fetchAll(args) {
  readConfig(process.cwd())
  for (const name of Object.keys(config.repositories)) {
    await fetch(name)
  }
}

/**
 * Rebuild documentation.
 */
async function buildAll(args) {
  readConfig(process.cwd())
  showConfig()
  if (!args.no_pull) {
    await fetchAll()
  }
  await makeTsConfig()
  await makeTypedocConfig()
  await compile()
}

/**
 * Launch the watch mode for documentation builder.
 */
async function watch() {
  readConfig(process.cwd())
  showConfig()
  await system(`cd "${config.buildDir}" && npx typedoc --watch`)
}

/**
 * Commit changes in document repos.
 */
async function commit() {
  readConfig(process.cwd())
  for (const repo of Object.keys(config.repositories)) {
    const status = await system(`cd ${config.buildDir}/${repo} && git status --porcelain`)
    if (status.trim() !== '') {
      await system(`cd ${config.buildDir}/${repo} && git pull --no-edit && git commit -a -m "Update documentation." && git push`)
    }
  }
}

/**
 * Delete document repos.
 */
async function clean() {
  readConfig(process.cwd())
  for (const repo of Object.keys(config.repositories)) {
    if (fs.existsSync(`${config.buildDir}/${repo}`)) {
      const status = await system(`cd ${config.buildDir}/${repo} && git status --porcelain`)
      if (status.trim() !== '') {
        throw new Error(`There are uncommited changes in ${config.buildDir}/${repo} - refusing to remove.`)
      }
      log(`Deleting ${config.buildDir}/${repo}`)
      await system(`rm -fr ${config.buildDir}/${repo}`)
    }
  }
}

/**
 * Main program.
 */
async function main() {

  const parser = new ArgumentParser({
    description: 'Doccer CLI'
  })
  parser.add_argument('operation', { choices: ['build-all', 'watch', 'commit', 'clean', 'fetch'] })
  parser.add_argument('--no-pull', { action: 'store_true', help: 'Skip git pull.' })

  const args = parser.parse_args()

  switch (args.operation) {
    case 'build-all':
      await buildAll(args)
      break
    case 'watch':
      await watch()
      break
    case 'commit':
      await commit()
      break
    case 'clean':
      await clean()
      break
    case 'fetch':
      await fetchAll()
      break
    }
}

await main(process.argv.slice(2))
