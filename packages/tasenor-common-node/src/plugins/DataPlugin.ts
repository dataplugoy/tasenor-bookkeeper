import fs from 'fs'
import { BackendPlugin } from './BackendPlugin'

/**
 * A plugin providing mainly some kind of possibly frequently updated data source services.
 * Data will be publicly available from API `/knowledge` end-point.
 */
export class DataPlugin extends BackendPlugin {

  protected sources: string[]

  constructor(...sources: string[]) {
    super()
    this.sources = sources
  }

  /**
   * Provide the public knowledge this plugin is providing and which is given in default API.
   */
  async getCommonKnowledge(): Promise<Record<string, unknown>> {
    const result = {}
    for (const source of this.sources) {
      const filePath = this.filePath(`${source}.json`)
      const data = JSON.parse(fs.readFileSync(filePath).toString('utf-8'))
      Object.assign(result, { [source]: data })
    }
    return result
  }
}
