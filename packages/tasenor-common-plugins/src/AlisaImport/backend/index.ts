import { ImportPlugin } from '@tasenor/common-node'
import { PluginCode, Version } from '@tasenor/common'
import { AlisaHandler } from './AlisaHandler'

class AlisaImportPlugin extends ImportPlugin {

  constructor() {
    super(new AlisaHandler())

    this.code = 'AlisaImport' as PluginCode
    this.title = 'Import for Alisa'
    this.version = '1.0.0' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M5 6.99h3V14h2V6.99h3L9 3zM14 10v7.01h-3L15 21l4-3.99h-3V10z"/></svg>'
    this.releaseDate = '2025-02-09'
    this.use = 'backend'
    this.type = 'import'
    this.description = 'Import plugin for importing transaction data in CSV format provided by Alisa Bank.'

    this.languages = this.getLanguages()
  }

}

export default AlisaImportPlugin
