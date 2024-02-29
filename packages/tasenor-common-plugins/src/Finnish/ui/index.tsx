import { LanguageUiPlugin } from '@tasenor/common-ui'
import FinnishHandler from '../common/FinnishHandler'

class Finnish extends LanguageUiPlugin {
  static code = 'Finnish'
  static title = 'Finnish'
  static version = '1.0.66'
  static icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12.36 6H7v6h7.24l.4 2H18V8h-5.24z" opacity=".3"/><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6zm3.6 8h-3.36l-.4-2H7V6h5.36l.4 2H18v6z"/></svg>'
  static releaseDate = '2023-06-10'
  static use = 'both'
  static type = 'language'
  static description = 'Finnish translation of the application.'

  constructor() {
    super()
    this.handler = new FinnishHandler()
  }
}

export default Finnish
