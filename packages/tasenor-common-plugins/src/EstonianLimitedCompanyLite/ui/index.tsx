import { SchemePlugin } from '@tasenor/common-ui'

class EstonianLimitedCompanyLite extends SchemePlugin {

  static code = 'EstonianLimitedCompanyLite'
  static title = 'Estonian Limited Company - Lite'
  static version = '1.0.0'
  static icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11.17 8l-.58-.59L9.17 6H4v12h16V8h-8z" opacity=".3"/><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l1.41 1.41.59.59H20v10z"/></svg>'
  static releaseDate = '2023-05-24'
  static use = 'both'
  static type = 'scheme'
  static description = 'Small accounting scheme for Estonian private limited company (OÜ). Finnish version only.'

  constructor() {
    super()
    this.languages = {
      fi: {
        'Private limited company (Lite scheme)': 'Osakeyhtiö (Suppea tilikartta)'
      }
    }
  }

  getAccountingSchemes() {
    return { EstonianLimitedCompanyLite: 'Private limited company (Lite scheme)' }
  }
}

export default EstonianLimitedCompanyLite
