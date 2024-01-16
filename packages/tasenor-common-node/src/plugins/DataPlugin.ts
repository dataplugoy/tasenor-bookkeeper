import fs from 'fs'
import { BackendPlugin } from './BackendPlugin'
import { ALL } from '@tasenor/common'

/**
 * Plugin data source names and query parameters.
 */
export interface DataPluginSources {
  // List of fixed JSON files (without .json) that are directly added to public common knowledge via API.
  common: string[]
  // List of data sets provided for backend internal use only.
  backend: string[]
}

/**
 * A plugin providing mainly some kind of possibly frequently updated data source services.
 * Data will be publicly available from API `/knowledge` end-point.
 */
export class DataPlugin extends BackendPlugin {

  protected sources: DataPluginSources
  protected jsonCache: Record<string, Record<string, unknown>>

  constructor(sources: DataPluginSources) {
    super()
    this.sources = sources
    this.jsonCache = {}
  }

  /**
   * Provide the public knowledge this plugin is providing and which is given in default API.
   */
  async getCommonKnowledge(): Promise<Record<string, unknown>> {
    const result = {}
    for (const source of this.sources.common) {
      const filePath = this.filePath(`${source}.json`)
      const data = this.afterLoad(`${source}.json`, JSON.parse(fs.readFileSync(filePath).toString('utf-8')))
      Object.assign(result, { [source]: data })
    }
    return result
  }

  /**
   * Load and cache named JSON file for this plugin.
   */
  loadCached<T>(name: string): Record<string, T> {
    if (this.jsonCache[name]) {
      return this.jsonCache[name] as Record<string, T>
    }
    const filePath = this.filePath(name)
    this.jsonCache[name] = JSON.parse(fs.readFileSync(filePath).toString('utf-8'))
    return this.afterLoad(name, this.jsonCache[name] as Record<string, T>)
  }

  /**
   * Fill in aliases.
   */
  afterLoad<T>(fileName: string, data: Record<string, T>): Record<string, T> {
    return data
  }

  /**
   * Data service used internally in the backend. If return value is `undefined`, query was not understood.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async queryBackend<T>(dataSet: string, query: typeof ALL | string): Promise<undefined | T> {
    return undefined
  }
}
