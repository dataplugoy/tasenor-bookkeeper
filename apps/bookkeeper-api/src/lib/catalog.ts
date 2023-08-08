import {
  AssetTransfer,
  BackendCatalog,
  CatalogHook,
  CatalogHooks,
  Currency,
  DatabaseName,
  Email,
  error,
  Hostname,
  Knowledge,
  KnowledgeBase,
  Language,
  log,
  LoginPluginData,
  note,
  PluginCode,
  ReportID,
  ReportOptions,
  TasenorPlugin,
  TokenPair,
  TsvFilePath,
  VATTarget
} from '@tasenor/common'
import { plugins, BackendPlugin, ImportPlugin, KnexDatabase, ReportPlugin, SchemePlugin, ServicePlugin, TransactionImportHandler, DB, DataPlugin, ToolPlugin } from '@tasenor/common-node'
import path from 'path'
import knex from './knex'

const { loadPluginIndex, isInstalled } = plugins

/**
 * Plugin accessor catalog for backend.
 */
export class Catalog {

  private available: TasenorPlugin[]
  private plugins: BackendPlugin[]
  private servicePlugins: ServicePlugin[]
  private reportPlugins: ReportPlugin[]
  private schemePlugins: SchemePlugin[]
  private importPlugins: ImportPlugin[]
  private dataPlugins: DataPlugin[]
  private toolPlugins: ToolPlugin[]
  private services: Record<string, ServicePlugin[]>
  private translations: Record<string, Record<string, string>>
  private hooks: CatalogHooks = {
    registerUser: [],
    afterLogin: [],
    subscribe: [],
    unsubscribe: []
  }

  constructor() {
    this.reset()
  }

  reset(): void {
    this.available = []
    this.plugins = []
    this.servicePlugins = []
    this.reportPlugins = []
    this.schemePlugins = []
    this.importPlugins = []
    this.dataPlugins = []
    this.toolPlugins = []
    this.services = {}
    this.translations = {
      en: {}
    }
  }

  /**
   * Load plugin data instantiate it.
   * @param plugin
   */
  load(plugin): BackendPlugin {
    if (plugin.use !== 'backend' && plugin.use !== 'both') {
      throw new Error(`Cannot load plugin '${plugin.code}' with '${plugin.use}'-usage on backend.`)
    }
    log(`Loading ${plugin.title} v${plugin.version}`)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const imported = require(path.join(plugin.path, 'backend', 'index.ts'))
    const Class = imported.default || imported
    const instance = BackendPlugin.create(Class, plugin.id, plugin.path, this)
    instance.load(this as unknown as BackendCatalog)

    // Get translations.
    const languages = instance.languages
    for (const lang of Object.keys(languages)) {
      this.translations[lang] = this.translations[lang] || {}
      Object.assign(this.translations[lang], languages[lang])
    }
    // Add to plugin collections.
    this.plugins.push(instance)
    if (!catalog[`${plugin.type}Plugins`]) {
      throw new Error(`Invalid plugin type '${plugin.type}' in the plugin catalog.`)
    }
    this[`${plugin.type}Plugins`].push(instance)
    if (plugin.type === 'service') {
      for (const service of (instance as ServicePlugin).getServices()) {
        this.services[service] = this.services[service] || []
        this.services[service].push(instance as ServicePlugin)
      }
    }

    return instance
  }

  /**
   * Recreate all plugins.
   */
  async reload(): Promise<void> {
    this.reset()
    log('Loading plugins...')
    for (const plugin of await loadPluginIndex()) {
      this.available.push(plugin)
      if ((plugin.use === 'backend' || plugin.use === 'both') && isInstalled(plugin)) {
        this.load(plugin)
      }
    }
    log(`...done scanning ${this.plugins.length} plugin(s) loaded.`)
  }

  /**
   * Find a plugin instance if it is installed.
   * @param code
   */
  find(code: PluginCode): BackendPlugin | undefined {
    return this.plugins.find(p => p.code === code)
  }

  /**
   * Find a plugin data if known.
   * @param code
   */
  findAvailable(code: PluginCode): TasenorPlugin | undefined {
    return this.available.find(p => p.code === code)
  }

  /**
   * Call hook after installing plugin.
   * @param code
   */
  async install(code: PluginCode): Promise<void> {
    const plugin = this.find(code)
    if (!plugin) {
      // It is probably UI plugin. No further action.
      // TODO: We should verify that it is in available list, though.
      return
    }
    note(`Setting up ${plugin.title} v${plugin.version}`)
    await plugin.install()
    for (const name of await knex.allDbs()) {
      log(`  Adding to database ${name}`)
      const db = await DB.get(knex.masterDb(), name as DatabaseName, process.env.DB_HOST_OVERRIDE as Hostname)
      try {
        await plugin.installToDb(db)
      } catch (err) {
        error(`Error on DB '${name}' during install of '${code}':`, err)
      }
    }
  }

  /**
   * Call hook after uninstalling plugin.
   * @param code
   */
  async uninstall(code: PluginCode): Promise<void> {
    const plugin = this.find(code)
    if (!plugin) {
      // It is probably UI plugin. No further action.
      // TODO: We should verify that it is in available list, though.
      return
    }
    note(`Removing ${plugin.title} v${plugin.version}`)
    for (const name of await knex.allDbs()) {
      log(`  Removing from database ${name}`)
      const db = await DB.get(knex.masterDb(), name as DatabaseName, process.env.DB_HOST_OVERRIDE as Hostname)
      try {
        await plugin.uninstallFromDb(db)
      } catch (err) {
        error(`Error on DB '${name}' during uninstall of '${code}':`, err)
      }
    }
    await plugin.uninstall()
  }

  /**
   * Install all plugins to new database.
   * @param db
   */
  async installPluginsToDb(db: KnexDatabase): Promise<void> {
    for (const plugin of this.plugins) {
      log(`Installing ${plugin.code} to database.`)
      await plugin.installToDb(db)
    }
  }

  /**
   * Collect all or one specific translations from plugins.
   * @returns
   */
  getTranslations(language?: Language): Record<string, Record<string, string>> {
    const ret = {}
    for (const lang of Object.keys(this.translations)) {
      if (lang === 'en' || !language || lang === language) {
        ret[lang] = ret[lang] || {}
        Object.assign(ret[lang], this.translations[lang])
      }
    }
    return ret
  }

  /**
   * Do the translation for a string.
   */
  t(str: string, lang: Language): string {
    return ((lang in this.translations) && (str in this.translations[lang])) ? this.translations[lang][str] : str
  }

  /**
   * Find the plugin providing the accounting scheme.
   * @param code
   */
  getSchemePlugin(code: PluginCode): SchemePlugin | undefined {
    for (const plugin of this.schemePlugins) {
      if (plugin.hasScheme(code)) {
        return plugin
      }
    }
  }

  /**
   * Get the accounting scheme data for the given scheme code and language.
   * @param code
   * @returns Paths to files or null if not found.
   */
  getSchemePaths(code: PluginCode, language): TsvFilePath[] | null {
    const plugin = this.getSchemePlugin(code)
    return plugin ? plugin.getSchemePaths(code, language) : null
  }

  /**
   * Get the default settings for the new database.
   * @param  code
   * @returns
   */
  getSchemeDefaults(code: PluginCode): Record<string, unknown> | null {
    const plugin = this.getSchemePlugin(code)
    return plugin ? plugin.getSchemeDefaults(code) : null
  }

  /**
   * Get all available report IDs.
   */
  async getReportIDs(scheme: string | undefined = undefined): Promise<Set<ReportID>> {
    const reports = new Set<ReportID>()
    for (const plugin of this.reportPlugins) {
      for (const id of plugin.getFormats(scheme)) {
        reports.add(id)
      }
    }
    return reports
  }

  /**
   * Get the report plugin by its ID.
   */
  getReportPlgugin(id: ReportID): ReportPlugin | null {
    for (const plugin of this.reportPlugins) {
      if (plugin.hasReport(id)) {
        return plugin
      }
    }
    return null
  }

  /**
   * Get UI options for the report.
   */
  getReportOptions(id: ReportID): ReportOptions {
    const plugin = this.getReportPlgugin(id)
    return plugin ? plugin.getReportOptions(id) : {}
  }

  /**
   * Get a set of service names available.
   */
  getServices(): string[] {
    const available = new Set<string>()
    for (const plugin of this.servicePlugins) {
      plugin.getServices().forEach(s => available.add(s))
    }
    return [...Array.from(available.values())]
  }

  /**
   * Collect plugins providing the given service.
   * @param service Name of the service.
   */
  getServiceProviders(service): ServicePlugin[] {
    return this.services[service] || []
  }

  /**
   * Collect a list of all plugins IDs.
   */
  getPluginsIDs(): number[] {
    return this.available.map(plugin => plugin.id || 0)
  }

  /**
   * Collect a list of all plugins IDs.
   */
  getInstalledPluginsIDs(): number[] {
    return this.available.filter(plugin => plugin.installedVersion).map(plugin => plugin.id || 0)
  }

  /**
   * Collect a list of plugins, that have settings.
   */
  getPluginsWithSettings(): BackendPlugin[] {
    const plugins: BackendPlugin[] = []
    for (const plugin of this.plugins) {
      if (plugin.getSettings()) {
        plugins.push(plugin)
      }
    }
    return plugins
  }

  /**
   * Get all available import handlers.
   * @returns
   */
  getImportHandlers(): TransactionImportHandler[] {
    return this.importPlugins.map(plugin => plugin.getHandler())
  }

  /**
   * Collect all public data from data plugins.
   */
  async getKnowledge(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {}
    for (const plugin of this.dataPlugins) {
      const data = await plugin.getKnowledge()
      Object.assign(result, data)
    }
    return result
  }

  /**
   * Get the VAT for transfer.
   * @param time
   * @param transfer
   * @param currency
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getVAT(time: Date, transfer: AssetTransfer, currency: Currency): Promise<null | number> {
    const knowledge = new Knowledge(await this.getKnowledge() as KnowledgeBase)
    return knowledge.vat(transfer.asset as VATTarget, time) || null
  }

  /**
   * Execute async callback for every plugin.
   */
  async forEach(callback: (plugin: BackendPlugin) => Promise<void>) {
    for (const plugin of this.plugins) {
      await callback(plugin)
    }
  }

  /**
   * Register a function to be executed in the named hook.
   */
  registerHook(name: string, func: CatalogHook): void {
    if (!this.hooks[name]) {
      throw new Error(`Invalid hook name '${name}'.`)
    }
    log(`  Registering hook '${name}'.`)
    this.hooks[name].push(func)
  }

  /**
   * Hook to add data to tokens returned by login API POST /auth.
   */
  async afterLogin(user: Email, tokens: TokenPair): Promise<TokenPair & Record<string, unknown>> {
    for (const hook of this.hooks.afterLogin) {
      tokens = await hook(user, tokens)
    }
    return tokens
  }

  /**
   * Hook executed during user registration.
   */
  async registerUser(name: string, user: Email): Promise<boolean> {
    for (const hook of this.hooks.registerUser) {
      if (!await hook(name, user)) {
        return false
      }
    }
    return true
  }

  /**
   * Hook for subscribing plugins.
   */
  async subscribe(user: Email, code: PluginCode): Promise<LoginPluginData | null> {
    return this.hooks.subscribe.length ? this.hooks.subscribe[0](user, code) : null
  }

  /**
   * Hook for unsubscribing plugins.
   */
  async unsubscribe(user: Email, code: PluginCode): Promise<LoginPluginData | null> {
    return this.hooks.unsubscribe.length ? this.hooks.unsubscribe[0](user, code) : null
  }
}

// Global instance.
const catalog = new Catalog()

export default catalog
