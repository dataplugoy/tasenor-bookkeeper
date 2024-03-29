import { CurrencyPlugin } from '@tasenor/common-ui'

class Rand extends CurrencyPlugin {

  static code = 'Rand'
  static title = 'Currency Rand'
  static version = '1.0.10'
  static icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15 16h3c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1zm1-6h1v4h-1v-4zm-7 6h3c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1zm1-6h1v4h-1v-4zM5 8h2v8H5zM2 4v16h20V4H2zm18 14H4V6h16v12z"/></svg>'
  static releaseDate = '2022-03-11'
  static use = 'ui'
  static type = 'currency'
  static description = 'Support for South African Rand currency.'

  getCurrencySymbol() {
    return 'R'
  }

  getCurrencyCode() {
    return 'ZAR'
  }

  money2str(cents) {
    return this.makeMoney(cents, 100, 2, 'R ', ',', '.', '')
  }
}

export default Rand
