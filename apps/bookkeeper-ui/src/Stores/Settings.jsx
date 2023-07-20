import { makeObservable, observable, runInAction } from 'mobx'

/**
 * All settings.
 */
class Settings {

  @observable settings = {}
  @observable system = {}
  @observable plugins = {}

  constructor() {
    makeObservable(this)
  }

  /**
   * Set new values.
   * @param {Object} values
   */
  update(values) {
    runInAction(() => {
      Object.assign(this.settings, values)
    })
  }

  /**
   * Set new global values.
   * @param {Object} values
   */
  updateSystem(values) {
    runInAction(() => {
      Object.assign(this.system, values)
      Object.assign(this.settings, values)
    })
  }

  /**
   * Set new plugin settings for bakcend plugins.
   * @param {Object} values
   */
  updatePlugins(values) {
    runInAction(() => {
      Object.assign(this.plugins, values)
      for (const plugin of Object.values(values)) {
        for (const variable of Object.keys(plugin.settings)) {
          this.settings[`${plugin.code}.${variable}`] = plugin.settings[variable]
        }
      }
    })
  }

  /**
   * Update one or more values in the backend plugin settings.
   * @param values
   */
  updatePlugin(values) {
    Object.entries(values).forEach(([name, value]) => {
      this.settings[name] = value
      const [plugin, variable] = name.split('.')
      this.plugins[plugin].settings[variable] = value
    })
  }

  /**
   * Reset to the defaults.
   */
  reset() {
    runInAction(() => {
      this.settings = {}
      this.system = {}
      this.plugins = {}
    })
  }

  /**
   * Get a value for the setting.
   * @param {String} name
   */
  get(name) {
    return this.settings[name]
  }

  /**
   * Get a value for the global setting.
   * @param {String} name
   */
  getSystem(name) {
    return this.system[name]
  }

  /**
   * Get a list of all backend plugin ui setups.
   */
  getPluginSettings() {
    return Object.values(this.plugins)
  }

  /**
   * Change a value for the setting.
   * @param {String} name
   * @param {Any} value
   */
  set(name, value) {
    runInAction(() => {
      this.settings[name] = value
    })
  }
}

export default Settings
