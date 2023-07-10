import React, { Component } from 'react'
import { Catalog, Store, Settings, PluginCode, Version, ShortDate, PluginUse, PluginType, ID, Language } from '@dataplug/tasenor-common'
import { History } from 'history'

export class UiPlugin extends Component {

  // Accessors.
  store: Store
  settings: Settings
  catalog: Catalog

  // This is meta data for this plugin instance.
  id: ID = null
  code: PluginCode | null = null
  title: string | null = null
  version: Version | null = null
  releaseDate: ShortDate | null = null
  use: PluginUse | null = null
  type: PluginType | null = null
  description: string | null = null

  // Plugin translations from language code to the translation dictionary.
  languages = {
  }

  constructor() {
    super({})
    this.languages = {}
  }

  /**
   * Initialization function to set up hooks if any.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  init(catalog: Catalog) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  }

  /**
   * Create an instance of a plugin class and copy static fields into the instance.
   * @param {Function} Class
   * @returns
   */
  static create(Class, catalog, store) {
    const plugin = new Class()
    plugin.code = Class.code
    plugin.title = Class.title
    plugin.version = Class.version
    plugin.releaseDate = Class.releaseDate
    plugin.use = Class.use
    plugin.type = Class.type
    plugin.description = Class.description

    // Add handles to store, settings and the catalog itself.
    plugin.store = store
    plugin.settings = store.settings
    plugin.catalog = catalog

    return plugin
  }

  /**
   * Do the translation for the string in the current language.
   */
  t(str: string, lang: Language | undefined = undefined): string {
    if (!lang) {
      lang = this.settings.get('language') as Language || 'en'
    }
    return this.catalog ? this.catalog.t(str, lang) : str
  }

  /**
   * Go to the given URL.
   * @param {String} url
   */
  goto(url) {
    if (!this.catalog) {
      throw new Error('Cannot use goto() when there is no catalog connected in plugin.')
    }
    (this.catalog.history as History).push(url)
  }

  /**
   * Get the UI setting description or null if the plugin has no settings.
   */
  getSettings(): Record<string, unknown> | null {
    return null
  }

  /**
   * Get all known default values for settings.
   */
  getDefaults(): Record<string, unknown> | null {
    return null
  }

  /**
   * Get the value of the plugin setting.
   * @param name
   */
  getSetting(name): unknown {
    return this.settings ? this.settings.get(`${this.code}.${name}`) : undefined
  }

  render() {
    return <></>
  }
}
