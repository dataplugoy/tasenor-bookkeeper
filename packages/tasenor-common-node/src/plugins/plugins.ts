import fs from 'fs'
import glob, { globSync } from 'fast-glob'
import path from 'path'
import { TasenorPlugin, PluginCatalog, FilePath, Url, note, log, DirectoryPath, error, GET, warning } from '@tasenor/common'
import { create } from 'ts-opaque'
import { vault } from '../net'
import { systemPiped } from '..'

const PLUGIN_FIELDS = ['code', 'title', 'version', 'icon', 'releaseDate', 'use', 'type', 'description']

interface PluginConfig {
  PLUGIN_PATH?: string
  INITIAL_PLUGIN_REPOS?: string
}
type ConfigVariable = keyof PluginConfig

// Internal configuration for the module.
const config: PluginConfig = {
  PLUGIN_PATH: undefined,
  INITIAL_PLUGIN_REPOS: undefined
}

interface PluginState {
  installed: boolean
}

/**
 * Get the configuration variable or throw an error.
 * @param variable Name of the variable.
 */
function getConfig(variable: ConfigVariable): string {
  const value = config[variable]
  if (value === undefined) {
    throw new Error(`Configuration variable ${variable} is required but it is not set.`)
  }
  return value
}

/**
 * Set the configuration variable. When setting the root for plugins other directories are set automatically.
 * @param variable Name of the variable.
 * @param value Value of the variable.
 */
function setConfig(variable: ConfigVariable, value: string): void {
  if (variable in config) {
    config[variable] = value
  } else {
    throw new Error(`No such configuration variable as ${variable}.`)
  }
}

/**
 * Sort list of plugins according to the code.
 * @param plugins A list of plugins.
 * @returns New sorted list.
 */
function sortPlugins(plugins: TasenorPlugin[]): TasenorPlugin[] {
  if (!plugins) {
    error('No plugins given found for sorting.')
    return []
  }
  return plugins.sort((a, b) => a.code < b.code ? -1 : (a.code > b.code ? 1 : 0))
}

/**
 * Compare two plugin lists if they are essentially the same.
 * @param listA
 * @param listB
 * @returns True if code, versions and path match.
 */
function samePlugins(listA: TasenorPlugin[], listB: TasenorPlugin[]): boolean {
  if (listA.length !== listB.length) {
    return false
  }
  listA = sortPlugins(listA)
  listB = sortPlugins(listB)
  for (let i = 0; i < listA.length; i++) {
    if (listA[i].id !== listB[i].id ||
      listA[i].code !== listB[i].code ||
      listA[i].installedVersion !== listB[i].installedVersion ||
      listA[i].path !== listB[i].path
    ) {
      return false
    }
  }
  return true
}

/**
 * Read in the current `index.json` file.
 */
function loadPluginIndex(): PluginCatalog {
  const indexPath = path.join(getConfig('PLUGIN_PATH'), 'index.json')
  note(`Loading plugin index from '${indexPath}'.`)
  if (fs.existsSync(indexPath)) {
    return JSON.parse(fs.readFileSync(indexPath).toString('utf-8'))
  }
  return []
}

/**
 * Store plugin index.
 * @param plugins
 */
function savePluginIndex(plugins) {
  plugins = sortPlugins(plugins)
  const indexPath = path.join(getConfig('PLUGIN_PATH'), 'index.json')
  note(`Saving plugin index to '${indexPath}'.`)
  fs.writeFileSync(indexPath, JSON.stringify(plugins, null, 2) + '\n')
}

/**
 * Update one plugin in the index.
 */
function updatePluginIndex(plugin: TasenorPlugin, plugins: TasenorPlugin[] | undefined = undefined) {
  const old = findPluginFromIndex(plugin.code, plugins)
  if (!old) {
    throw new Error(`Cannot update non-existing plugin ${plugin.code}.`)
  }
  Object.assign(old, plugin)
  savePluginIndex(plugins)

  return plugins
}

/**
 * Find the named plugin from the current `index.json` file or from the list if given..
 * @param {String} code
 * @returns Data or null if not found.
 */
function findPluginFromIndex(code: string, plugins: TasenorPlugin[] | undefined = undefined): TasenorPlugin | null {
  const index = plugins || loadPluginIndex()
  const plugin = index.find(plugin => plugin.code === code)
  return plugin || null
}

/**
 * Get the current plugin list maintained by some master API.
 * @returns The latest list.
 */
async function fetchOfficialPluginList(): Promise<TasenorPlugin[]> {
  const url = vault.get('TASENOR_API_URL', '')
  if (url) {
    const plugins = await GET(`${url}/plugins` as Url)
    if (plugins.success) {
      return plugins.data as unknown as TasenorPlugin[]
    }
  }
  return []
}

/**
 * Scan all plugins from the plugin directory based on index files found.
 */
function scanPlugins(): TasenorPlugin[] {
  const rootPath = path.resolve(getConfig('PLUGIN_PATH'))
  log(`Scanning plugins from ${rootPath}.`)
  let uiFiles: FilePath[] = []
  let backendFiles: FilePath[] = []

  // Scan each dir resolving symlinks first.
  const dirs = [rootPath]

  dirs.map(dir => fs.realpathSync(dir)).forEach(dir => {
    uiFiles = uiFiles.concat(
      glob.sync(path.join(dir, '**', 'ui', 'index.tsx')).map(
        p => p.substring(0, p.length - 'ui/index.tsx'.length) as FilePath
      )
    )

    backendFiles = backendFiles.concat(
      glob.sync(path.join(dir, '**', 'backend', 'index.ts')).map(
        p => p.substring(0, p.length - 'backend/index.ts'.length) as FilePath
      )
    )
  })

  const pluginSet = new Set<FilePath>(uiFiles.concat(backendFiles))

  return [...pluginSet].map(scanPlugin)
}

/**
 * Read data from the plugin's index file(s) found from the given path.
 */
function scanPlugin(pluginPath: FilePath): TasenorPlugin {
  const uiPath: FilePath = path.join(pluginPath, 'ui', 'index.tsx') as FilePath
  const ui = fs.existsSync(uiPath) ? readUIPlugin(uiPath) : null
  const backendPath: FilePath = path.join(pluginPath, 'backend', 'index.ts') as FilePath
  const backend = fs.existsSync(backendPath) ? readBackendPlugin(backendPath) : null
  if (ui && backend) {
    for (const field of PLUGIN_FIELDS) {
      if (ui[field] !== backend[field]) {
        throw new Error(`A field '${field}' have contradicting values ${JSON.stringify(ui[field])} and ${JSON.stringify(backend[field])} for index files '${uiPath}' and '${backendPath}'.`)
      }
    }
  }
  if (ui === null && backend === null) {
    throw new Error(`Cannot find any plugins in '${pluginPath}'.`)
  }

  return ui || backend as TasenorPlugin
}

/**
 * Read UI plugin data from the given index file.
 */
function readUIPlugin(indexPath: FilePath): TasenorPlugin {
  const regex = new RegExp(`^\\s*static\\s+(${PLUGIN_FIELDS.join('|')})\\s*=\\s*(?:'([^']*)'|"([^"]*)")`)

  const data: TasenorPlugin = {
    code: create('Unknown'),
    title: 'Unknown Development Plugin',
    icon: 'HelpOutline',
    path: path.dirname(path.dirname(indexPath)),
    version: create('0'),
    releaseDate: null,
    use: 'unknown',
    type: 'unknown',
    description: 'No description'
  }
  const code = fs.readFileSync(indexPath).toString('utf-8').split('\n')
  for (const line of code) {
    const match = regex.exec(line)
    if (match) {
      data[match[1]] = match[2]
    }
  }

  return data
}

function readBackendPlugin(indexPath: FilePath): TasenorPlugin {
  const regex = new RegExp(`^\\s*this\\.(${PLUGIN_FIELDS.join('|')})\\s*=\\s*(?:'([^']*)'|"([^"]*)")`)

  const data: TasenorPlugin = {
    code: create('Unknown'),
    title: 'Unknown Development Plugin',
    icon: 'HelpOutline',
    path: path.dirname(path.dirname(indexPath)),
    version: create('0'),
    releaseDate: null,
    use: 'unknown',
    type: 'unknown',
    description: 'No description'
  }
  const code = fs.readFileSync(indexPath).toString('utf-8').split('\n')
  for (const line of code) {
    const match = regex.exec(line)
    if (match) {
      data[match[1]] = match[2]
    }
  }

  return data
}

/**
 * Read the local plugin state.
 */
function loadPluginState(plugin: TasenorPlugin): PluginState {
  const stateFile = plugin.path && path.join(plugin.path, '.state')
  if (stateFile && fs.existsSync(stateFile)) {
    return JSON.parse(fs.readFileSync(stateFile).toString('utf-8'))
  }
  return {
    installed: false
  }
}

/**
 * Save local plugin state.
 */
function savePluginState(plugin: TasenorPlugin, state: PluginState): void {
  const stateFile = path.join(plugin.path, '.state')
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n')
}

/**
 * Check if plugin is marked as installed.
 */
function isInstalled(plugin: TasenorPlugin): boolean {
  return loadPluginState(plugin).installed
}

/**
 * Combine official and installed plugins to the same list and save if changed.
 */
async function updatePluginList() {
  let current: TasenorPlugin[] = []

  // Get the official list if any.
  for (const plugin of await fetchOfficialPluginList()) {
    current[plugin.code] = plugin
  }

  // Collect and add local plugins.
  let localId = -1

  for (const plugin of await scanPlugins()) {
    if (!current[plugin.code]) {
      current[plugin.code] = plugin
      current[plugin.code].id = localId--
    }
    current[plugin.code].path = plugin.path
    current[plugin.code].version = plugin.version
    current[plugin.code].availableVersion = plugin.version
    if (isInstalled(plugin)) {
      current[plugin.code].installedVersion = plugin.version
    }
  }

  // Avoid dev server unnecessary restart.
  const old = loadPluginIndex()
  current = Object.values(current)
  if (!samePlugins(old, current)) {
    savePluginIndex(current)
  }

  return current
}

/**
 * Convert full path from UI or backend index file to relative path inside the plugin.
 */
function pluginLocalPath(indexFilePath: FilePath): string | undefined {
  const match = /\/[^/]+\/(ui|backend)\/index.tsx?$/.exec(indexFilePath)
  if (match) {
    return match[0].substring(1)
  }
}

/**
 * Calculate target directory for the repository.
 */
function targetDir(repo: string): DirectoryPath {
  if (!config.PLUGIN_PATH) throw new Error('config.PLUGIN_PATH not set.')
  if (repo.startsWith('file://')) {
    return path.join(config.PLUGIN_PATH, path.basename(repo)) as DirectoryPath
  } else if (repo.startsWith('npm://')) {
    const npm = repo.substring(6)
    return path.join(config.PLUGIN_PATH, npm.replace(/@/g, '').replace(/[^a-zA-Z0-9]/g, '-')) as DirectoryPath
  } else {
    return path.join(config.PLUGIN_PATH, repo.replace(/.*\//, '').replace('.git', '')) as DirectoryPath
  }
}

/**
 * Go through repository URLs and install all missing plugin repositories.
 */
async function fetchRepositories(srcRoot: DirectoryPath): Promise<boolean> {
  let changes = false
  if (!config.INITIAL_PLUGIN_REPOS) {
    warning('Cannot fetch plugin repos, since none defined in INITIAL_PLUGIN_REPOS.')
    return false
  }
  if (!config.PLUGIN_PATH) {
    warning('Cannot fetch plugin repos, since PLUGIN_PATH not defined.')
    return false
  }
  for (const repo of config.INITIAL_PLUGIN_REPOS?.split(' ')) {
    const target = targetDir(repo)
    if (fs.existsSync(target)) {
      continue
    }
    log(`Fetching plugin repo ${repo}.`)
    if (repo.startsWith('file://')) {
      // Handle local file.
      const source = path.join(srcRoot, repo.substring(7))
      if (fs.existsSync(srcRoot)) {
        if (!fs.existsSync(target)) {
          log(`  Linking repo ${source} => ${target}.`)
          const cmd = `ln -sf "${source}" "${target}"`
          await systemPiped(cmd)
          changes = true
        }
      } else {
        error(`A plugin repository ${repo} not found.`)
      }
    } else if (repo.startsWith('npm://')) {
      const npm = repo.substring(6)
      const source = path.join(config.PLUGIN_PATH, 'package')
      log(`  Downloading NPM ${npm}.`)
      const cmd = `cd "${config.PLUGIN_PATH}" && rm -fr "${source}" && npm view ${npm} dist.tarball | xargs curl -s | tar xz && mv "${source}" "${target}"`
      await systemPiped(cmd)
      changes = true
    } else {
      // By default, assume git repo.
      log(`  Fetching plugin repo ${repo} to ${target}.`)
      const cmd = `cd "${config.PLUGIN_PATH}" && git clone "${repo}"`
      await systemPiped(cmd)
      changes = true
    }
  }

  return changes
}

/**
 * Go through repository URLs and install all missing plugin repositories.
 */
async function upgradeRepositories(srcRoot: DirectoryPath): Promise<boolean> {
  let changes = false
  if (!config.INITIAL_PLUGIN_REPOS) {
    warning('Cannot fetch plugin repos, since none defined in INITIAL_PLUGIN_REPOS.')
    return false
  }
  if (!config.PLUGIN_PATH) {
    warning('Cannot fetch plugin repos, since PLUGIN_PATH not defined.')
    return false
  }

  changes = await fetchRepositories(srcRoot)

  for (const repo of config.INITIAL_PLUGIN_REPOS?.split(' ')) {
    log(`Upgrading plugin repo '${repo}'...`)
    const target = targetDir(repo)
    if (repo.startsWith('file://')) {
      log('  Nothing to do for symlink.')
    } else if (repo.startsWith('npm://')) {
      const npm = repo.substring(6)
      const cmd = `npm view ${npm} version`
      const newVersion = (await systemPiped(cmd, true))?.trim()
      const oldVersion = JSON.parse(fs.readFileSync(path.join(target, 'package.json')).toString('utf-8')).version
      if (newVersion === oldVersion) {
        log(`  The latest version ${newVersion} already installed.`)
      } else {
        log(`  Upgrading ${npm} from version ${oldVersion} to ${newVersion}.`)
        const source = path.join(config.PLUGIN_PATH, 'package')
        const cmd = `cd "${config.PLUGIN_PATH}" && rm -fr "${source}" "${target}" && npm view ${npm} dist.tarball | xargs curl -s | tar xz && mv "${source}" "${target}"`
        await systemPiped(cmd)
        changes = true
      }
    } else {
      const cmd = `cd "${config.PLUGIN_PATH}" && git pull`
      await systemPiped(cmd)
      // Note, too lazy to detect changes. Is the return value even used?
    }
  }

  return changes
}

/**
 * Check that plugin directory does not have any extra files or that there are no missing plugin repositories.
 */
function verifyPluginDir(): boolean {
  if (!config.INITIAL_PLUGIN_REPOS) {
    warning('No plugin repositories to verify.')
    return true
  }
  let fail = false
  const okayFiles = new Set(['.gitkeep', 'index.json', 'index.jsx', 'workspace'])
  for (const repo of config.INITIAL_PLUGIN_REPOS?.split(' ')) {
    const dir = targetDir(repo)
    okayFiles.add(path.basename(dir))
    if (!fs.existsSync(dir)) {
      error(`Requiered repository ${repo} does not exist.`)
      fail = true
    }
  }
  if (config.PLUGIN_PATH) {
    for (const fullPath of globSync(config.PLUGIN_PATH + '/**', { dot: true, deep: 2 })) {
      const localPath = fullPath.replace(config.PLUGIN_PATH + '/', '')
      const file = localPath.indexOf('/') < 0 ? localPath : path.dirname(localPath)
      if (!okayFiles.has(file)) {
        error(`Plugin directory has unrecognized file/dir '${fullPath}'.`)
      }
    }
  }

  if (!fail) log('Plugin directory verified as correct.')

  return fail
}

/**
 * Collection of file system and API related plugin handling functions for fetching, building and scanning.
 */
export const plugins = {
  findPluginFromIndex,
  fetchOfficialPluginList,
  getConfig,
  isInstalled,
  loadPluginIndex,
  loadPluginState,
  pluginLocalPath,
  samePlugins,
  savePluginIndex,
  savePluginState,
  scanPlugins,
  setConfig,
  sortPlugins,
  updatePluginIndex,
  updatePluginList,
  upgradeRepositories,
  fetchRepositories,
  verifyPluginDir,
}
