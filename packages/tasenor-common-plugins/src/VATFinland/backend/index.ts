import { DataPlugin } from '@tasenor/common-node'
import { PluginCode, Version } from '@tasenor/common'

class VATFinland extends DataPlugin {
  constructor() {
    super({ common: ['vat'], backend: [] })

    this.code = 'VATFinland'as PluginCode
    this.title = 'VAT Data for Finland'
    this.version = '1.0.13' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/></g><g><g><g><path d="M7.5,4C5.57,4,4,5.57,4,7.5S5.57,11,7.5,11S11,9.43,11,7.5S9.43,4,7.5,4z M7.5,9C6.67,9,6,8.33,6,7.5S6.67,6,7.5,6 S9,6.67,9,7.5S8.33,9,7.5,9z M16.5,13c-1.93,0-3.5,1.57-3.5,3.5s1.57,3.5,3.5,3.5s3.5-1.57,3.5-3.5S18.43,13,16.5,13z M16.5,18 c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S17.33,18,16.5,18z M5.41,20L4,18.59L18.59,4L20,5.41L5.41,20z"/></g></g></g></svg>'
    this.releaseDate = '2022-07-23'
    this.use = 'backend'
    this.type = 'data'
    this.description = 'This plugin provides data needed for VAT handling in Finland.'

    this.languages = {
    }
  }
}

export default VATFinland
