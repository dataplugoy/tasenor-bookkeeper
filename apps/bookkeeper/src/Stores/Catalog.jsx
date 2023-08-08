import { latestVersion } from '@tasenor/common'
import { UiPlugin, Title } from '@tasenor/common-ui'
import { observable, makeObservable, runInAction } from 'mobx'
import dayjs from 'dayjs'
import { sprintf } from 'sprintf-js'
import React, { Component } from 'react'
import index from '../Plugins/index.jsx'
import indexJson from '../Plugins/index.json'
import { Trans } from 'react-i18next'
import EN from '../Data/english.json'
import i18n from '../i18n.jsx'

// How many fixed tools before plugin slots?
const FIRST_TOOL_MENU_SLOT = 3
// If set, add debug prints for showing what's going on in plugin logic.
const DEBUG_PLUGINS = false
const debugPlugins = (...args) => DEBUG_PLUGINS && console.log(...args)

debugPlugins('Index file:', index)
debugPlugins('Index JSON file:', indexJson)

/**
 * Plugin accessor catalog for UI.
 */
class Catalog extends Component {

  available = []
  index = []
  subscriptionData = {}

  constructor(store) {
    super({})
    this.navigate = null
    this.store = store
    this.index = []
    this.plugins = []
    this.languagePlugins = []
    this.pluginForLanguage = {}
    this.toolPlugins = []
    this.importPlugins = []
    this.reportPlugins = []
    this.schemePlugins = []
    this.servicePlugins = []
    this.currencyPlugin = {}
    this.dataPlugin = {}
    this.translations = {
      en: EN
    }
    this.hooks = {
      editTransaction: []
    }

    // Set up plugin index.
    indexJson.forEach(item => {
      this.available.push(item)
    })

    makeObservable(this, {
      available: observable,
      index: observable,
      subscriptionData: observable,
    })

    this.refreshPluginList()
  }

  /**
   * Reconstruct available plugin info based on the credentials.
   */
  async refreshPluginList() {

    debugPlugins('--- Plugin refresh ---')
    const data = await this.store.getClientData()
    const allowed = data ? new Set(data.plugins) : new Set()
    debugPlugins('Explicitly allowed plugins', allowed)
    const allowAll = this.store.isAdmin || this.store.isSuperuser
    debugPlugins('Allow all plugins?', allowAll ? 'YES' : 'NO')

    // List of all usable plugin instances.
    this.plugins = []
    this.pluginCodes = new Set()
    // List of usable plugin instances by each type.
    this.languagePlugins = []
    this.pluginForLanguage = {}
    this.toolPlugins = []
    this.schemePlugins = []
    this.currencyPlugin = {}
    // Plugin data of usable backend plugins.
    this.importPlugins = []
    this.reportPlugins = []
    this.servicePlugins = []
    this.dataPlugins = []

    // Set up plugin index.
    runInAction(() => {
      this.index.replace([])

      this.available.forEach(item => {
        debugPlugins('Checking if usable', item.code)
        this.index.push(item)
        // Language plugins must be available always for login screen.
        if (item.installedVersion && (allowAll || allowed.has(item.id) || item.type === 'language')) {
          this.pluginCodes.add(item.code)
          debugPlugins('  OK')
        }
        // Collect data for usable backend plugins.
        if (item.use === 'backend' && (allowAll || allowed.has(item.id))) {
          if (!this[`${item.type}Plugins`]) {
            throw new Error(`Invalid backend plugin type '${item.type}' in the plugin catalog.`)
          }
          this[`${item.type}Plugins`].push(item)
          debugPlugins('  OK')
        }
      })

      index.forEach(Class => {
      // Instantiate allowed plugins and add them to the plugin collection.
        const plugin = UiPlugin.create(Class, this, this.store)

        // Get all translations even from non-allowed plugins.
        if (plugin.languages) {
          Object.keys(plugin.languages).forEach(lang => {
            this.translations[lang] = this.translations[lang] || {}
            Object.assign(this.translations[lang], plugin.languages[lang])
          })
        }

        if (!this.pluginCodes.has(plugin.code)) {
          debugPlugins('Code', plugin.code, 'not allowed. Removing.')
          return
        }

        plugin.init(this)
        this.plugins.push(plugin)
        debugPlugins('Adding', plugin.code)
        // Handle some special plugins.
        if (plugin.type === 'currency') {
          this.currencyPlugin[plugin.getCurrencyCode()] = plugin
          return
        }

        // Add to type specific collection.
        if (!this[`${plugin.type}Plugins`]) {
          throw new Error(`Invalid plugin type '${plugin.type}' in the plugin catalog.`)
        }
        this[`${plugin.type}Plugins`].push(plugin)
      })

      // Map languages.
      this.languagePlugins.forEach(plugin => {
        for (const lang of plugin.getLanguages()) {
          this.pluginForLanguage[lang] = plugin
        }
      })

      // Construct subscription data.
      const subdata = {}
      if (data) {
        if (data.subscriptions) {
          for (const sub of data.subscriptions) {
            subdata[sub.pluginId] = subdata[sub.pluginId] || {}
            subdata[sub.pluginId].subscription = sub
          }
        }
        if (data.prices) {
          for (const price of data.prices) {
            subdata[price.pluginId] = subdata[price.pluginId] || {}
            subdata[price.pluginId].price = price
          }
        }
      }

      Object.assign(this.subscriptionData, subdata)
    })
  }

  /**
   * Register a function to be executed in the hook.
   * @param name
   * @param func
   */
  registerHook(name, func) {
    if (!this.hooks[name]) {
      throw new Error(`Invalid hook name '${name}'.`)
    }
    this.hooks[name].push(func)
  }

  /**
   * Fetch the latest plugin list.
   */
  async updatePluginList() {
    const plugins = await this.store.request('ui:/internal/plugins', 'GET')
    runInAction(() => {
      debugPlugins('Received update for plugins', plugins)
      this.index.replace(plugins)
    })
  }

  /**
   * Fetch the latest plugin list forcing the recompilation of the client.
   */
  async rebuildPluginList() {
    const plugins = await this.store.request('ui:/internal/plugins/rebuild', 'GET')
    runInAction(() => {
      debugPlugins('Received update after rebuild', plugins)
      this.index.replace(plugins)
    })
  }

  /**
   * Remove all plugins.
   */
  async resetPluginList() {
    await this.store.request('ui:/internal/plugins/reset', 'GET')
    await this.updatePluginList()
  }

  /**
   * Check if we have subscribed to plugin.
   * @param pluginCode
   */
  isAvailable(pluginCode) {
    return this.pluginCodes.has(pluginCode)
  }

  /**
   * Install plugin.
   * @param {Object} plugin
   */
  async install(plugin) {
    const { code } = plugin
    const res = await this.store.request('ui:/internal/plugins', 'POST', { code, version: plugin.availableVersion })
    if (res) {
      runInAction(() => {
        const pos = this.index.findIndex(p => p.code === code)
        this.index[pos] = res
      })
      this.store.addMessage('Plugin installed successfully.')
    }
  }

  /**
   * Update plugin.
   * @param {Object} plugin
   */
  async update(plugin) {
    const { code } = plugin
    const availableVersion = latestVersion(plugin.versions.map(v => v.version))
    const res = await this.store.request('ui:/internal/plugins', 'PATCH', { code, version: availableVersion })
    if (res) {
      runInAction(() => {
        const pos = this.index.findIndex(p => p.code === code)
        this.index[pos] = res
      })
      this.store.addMessage('Plugin update successfully.')
    }
  }

  /**
   * Remove plugin.
   * @param {Object} plugin
   */
  async uninstall(plugin) {
    const { code } = plugin
    const res = await this.store.request('ui:/internal/plugins', 'DELETE', { code })
    if (res) {
      runInAction(() => {
        const pos = this.index.findIndex(p => p.code === code)
        this.index[pos] = res
      })
      this.store.addMessage('Plugin deleted successfully.')
    }
  }

  /**
   * Get the translation dictionary for the given language combining all plugin translations.
   * @param {String} language
   */
  getTranslations(language) {
    return this.translations[language] || {}
  }

  /**
   * Get the current language.
   * @returns
   */
  language() {
    return i18n.language
  }

  /**
   * Collect list of installed languages.
   * @returns {Set}
   */
  languages() {
    return new Set(['en'].concat(Object.keys(this.pluginForLanguage)))
  }

  /**
   * Translate a string.
   * @param str
   * @returns
   */
  t(str) {
    const lang = this.language()
    return ((lang in this.translations) && (str in this.translations[lang])) ? this.translations[lang][str] : str
  }

  /**
   * Collect flags for available languages.
   * @returns Object mapping languages to flag codes.
   */
  flags() {
    const flags = { en: 'gb' }
    this.languagePlugins.forEach(plugin => {
      if (plugin.languages) {
        for (const lang of Object.keys(plugin.languages)) {
          flags[lang] = plugin.flag(lang)
        }
      }
    })
    return flags
  }

  /**
   * Check if key press can be handled by some plugin.
   * @param {String} context
   * @param {String} key
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  keyPress(context, key) {
    switch (context) {
      case 'tool':
        for (const menu of this.getToolMenu()) {
          if (`${menu.toolNumber}` === key) {
            if (menu.disabled) {
              return
            }
            this.navigate(this.url('tools', menu.code))
          }
        }
        break
      default:
        throw new Error(`Invalid key press context '${context}'.`)
    }
  }

  /**
   * Collect all menu entries for tools menu.
   * @returns [{ toolNumber, code, plugin, index }, ...]
   */
  getToolMenu() {
    const items = []
    let nextNumber = FIRST_TOOL_MENU_SLOT
    this.toolPlugins.forEach(plugin => {
      const menus = plugin.toolMenu()
      let n = 0
      menus.forEach(menu => {
        menu.toolNumber = nextNumber > 10 ? null : nextNumber++ % 10
        menu.plugin = plugin
        menu.code = plugin.code
        menu.index = n
        if (menus.length > 1 && n > 0) {
          menu.code += (n + 1)
        }
        n++
        items.push(menu)
      })
    })
    return items
  }

  /**
   * Construct url for the sub-page keeping DB, period and account IDs.
   * @param {String} page
   * @param {String} subPage
   * @returns
   */
  url(page, subPage) {
    const store = this.store
    return `/${store.db || '_'}/${page}/${store.periodId || ''}/${(store.account && store.account.id) || ''}/${subPage}`
  }

  /**
   * Render top panel for tool plugins.
   * @param {String} selected
   * @returns
   */
  renderToolTopPanel(selected) {
    const menu = this.getToolMenu()
    const match = menu.filter(m => m.code === selected)
    if (match.length) {
      const panel = match[0].plugin.toolTopPanel(menu[0].index)
      return (
        <>
          <Title><Trans>{match[0].plugin.toolTitle()}</Trans></Title>
          {panel}
        </>
      )
    }
  }

  /**
   * Render main panel for tool plugins.
   * @param {String} selected
   * @returns
   */
  renderToolMainPanel(selected) {
    const menu = this.getToolMenu()
    const match = menu.filter(m => m.code === selected)
    if (match.length) {
      return match[0].plugin.toolMainPanel(menu[0].index)
    }
  }

  /**
   * Gather available accounting schemes.
   * @returns A map from accounting scheme code names to their visual titles.
   */
  getAccountingSchemes() {
    return this.schemePlugins.reduce((prev, cur) => ({ ...prev, ...cur.getAccountingSchemes() }), {})
  }

  /**
   * This hook is called after editing a cell in single transaction.
   * @param {DocumentModel} document
   * @param {Number} row
   * @param {Number} column
   * @param {String} originalValue
   * @returns A set of account numbers that has changed.
   */
  async editTransaction(document, row, column, originalValue) {
    let ret = new Set()
    for (const hook of this.hooks.editTransaction) {
      const changes = await hook(document, row, column, originalValue)
      if (changes) {
        ret = new Set([...ret, ...changes])
      }
    }
    return ret
  }

  /**
   * Link application properties to catalog by attaching handles of them as a members for the catalog.
   * @param {Object} props
   */
  connectProps(props) {
    this.navigate = props.navigate
  }

  /**
   * Collect a list of plugins, that have settings.
   */
  getPluginsWithSettings() {
    const plugins = []
    for (const plugin of this.plugins) {
      if (plugin.getSettings()) {
        plugins.push(plugin)
      }
    }
    return plugins
  }

  /**
   * Get defaults from plugins, that have settings.
   * @param perPlugin If set, return object per plugin, otherwise as `<pluginCode>.<variableName>`.
   */
  getPluginDefaults(perPlugin = true) {
    const settings = {}
    for (const plugin of this.plugins) {
      const defs = plugin.getDefaults()
      if (defs) {
        if (perPlugin) {
          settings[plugin.code] = defs
        } else {
          Object.keys(defs).forEach(key => (settings[`${plugin.code}.${key}`] = defs[key]))
        }
      }
    }
    return settings
  }

  /**
   * Convert a date or datetime to the localized string based on the currently selected language.
   * @param date A date as a string YYYY-MM-DD or with time.
   * @return Year, month and day localized.
   */
  date2str(date) {
    const lang = this.language()
    if (this.pluginForLanguage[lang]) {
      return this.pluginForLanguage[lang].date2str(date)
    }
    return dayjs(date).format('YYYY-MM-DD')
  }

  /**
   * Convert (possibly partial) localized date to 'YYYY-MM-DD'
   * @param date A local format of date - possibly without year and/or month.
   * @param sample A sample to use for filling in missing parts (default: today)
   */
  str2date(str, sample = null) {
    sample = sample ? new Date(sample) : new Date()
    const lang = this.language()
    if (this.pluginForLanguage[lang]) {
      return this.pluginForLanguage[lang].str2date(str)
    }
    let year, month, day
    if (!/^\d{1,4}(-\d{1,2}(-\d{1,2})?)?$/.test(str)) {
      return undefined
    }
    [year, month, day] = str.split('-')
    day = parseInt(day)
    month = parseInt(month) || (sample.getMonth() + 1)
    year = parseInt(year) || sample.getFullYear()
    if (year < 100) {
      year += 2000
    }
    const date = dayjs(sprintf('%04d-%02d-%02d 00:00:00', year, month, day))
    return date.isValid() ? date.format('YYYY-MM-DD') : undefined
  }

  /**
   * Convert money value to string.
   */
  money2str(cents, currency, signed = false) {
    const sign = signed ? (cents < 0 ? '' : '+') : ''
    return (currency && this.currencyPlugin[currency]) ? this.currencyPlugin[currency].money2str(cents, signed) : sign + sprintf('%.2f', cents / 100) + ' ' + currency
  }

  /**
   * Get the display UTF-8 symbol or string for the currency.
   */
  getCurrencySymbol(currency) {
    return (currency && this.currencyPlugin[currency]) ? this.currencyPlugin[currency].getCurrencySymbol() : ''
  }

  /**
   * Get all 3-letter symbols of available currences.
   */
  getCurrencies() {
    return Object.keys(this.currencyPlugin)
  }

  /**
   * Get the all import plugins as mapping from their codes to titles.
   */
  getImportOptions() {
    return this.importPlugins.filter(plugin => !!plugin.installedVersion).reduce((prev, cur) => ({ ...prev, [cur.code]: cur.title }), {})
  }
}

export default Catalog
