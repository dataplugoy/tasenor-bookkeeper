import path from 'path'
import { SchemePlugin } from '@tasenor/common-node'
import { Currency, Language, PluginCode, SchemeName, TsvFilePath, Version } from '@tasenor/common'

class FinnishLimitedCompanyLite extends SchemePlugin {

  constructor() {
    super('FinnishLimitedCompanyLite' as SchemeName)

    this.code = 'FinnishLimitedCompanyLite' as PluginCode
    this.title = 'Finnish Limited Company - Lite'
    this.version = '1.0.27' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11.17 8l-.58-.59L9.17 6H4v12h16V8h-8z" opacity=".3"/><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l1.41 1.41.59.59H20v10z"/></svg>'
    this.releaseDate = '2023-05-24'
    this.use = 'both'
    this.type = 'scheme'
    this.description = 'Small accounting scheme for Finnish limited company. English and Finnish version.'

    this.languages = {
      fi: {
      }
    }
  }

  getSchemePaths(code, language): TsvFilePath[] {
    if (code === 'FinnishLimitedCompanyLite') {
      if (language === 'en') {
        return [
          path.join(__dirname, 'en-EUR.tsv'),
        ] as TsvFilePath[]
      }
      return [
        path.join(__dirname, 'fi-EUR.tsv'),
      ] as TsvFilePath[]
    }
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSchemeDefaults(code): Record<string, unknown> {
    return {}
  }

  supportedCurrencies(): Currency[] {
    return ['EUR']
  }

  supportedLanguages(): Language[] {
    return ['fi', 'en']
  }
}

export default FinnishLimitedCompanyLite
