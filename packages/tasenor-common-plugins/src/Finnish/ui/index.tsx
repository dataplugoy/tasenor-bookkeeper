import dayjs from 'dayjs'
import { sprintf } from 'sprintf-js'
import FI from './finnish.json'
import { LanguagePlugin } from '@tasenor/common-ui'

class Finnish extends LanguagePlugin {

  static code = 'Finnish'
  static title = 'Finnish'
  static version = '1.0.65'
  static icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12.36 6H7v6h7.24l.4 2H18V8h-5.24z" opacity=".3"/><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6zm3.6 8h-3.36l-.4-2H7V6h5.36l.4 2H18v6z"/></svg>'
  static releaseDate = '2023-06-10'
  static use = 'ui'
  static type = 'language'
  static description = 'Finnish translation of the application.'

  constructor() {
    super()
    this.languages = {
      fi: FI
    }
  }

  getLanguages() {
    return new Set(['fi'])
  }

  flag() {
    return 'fi'
  }

  date2str(date) {
    return dayjs(date).format('DD.MM.YYYY')
  }

  str2date(str, sample: null | Date = null) {
    sample = sample ? new Date(sample) : new Date()
    let year, month, day
    if (!/^\d{1,2}(\.\d{1,2}(\.\d{1,4})?)?$/.test(str)) {
      return undefined
    }
    [day, month, year] = str.split('.')
    day = parseInt(day)
    month = parseInt(month) || (sample.getMonth() + 1)
    year = parseInt(year) || sample.getFullYear()
    if (year < 100) {
      year += 2000
    }
    const date = dayjs(sprintf('%04d-%02d-%02d', year, month, day))
    return date.isValid() ? date.format('YYYY-MM-DD') : undefined
  }
}

export default Finnish
