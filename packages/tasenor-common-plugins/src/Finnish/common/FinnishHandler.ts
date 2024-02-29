import dayjs from 'dayjs'
import { sprintf } from 'sprintf-js'
import FI from './finnish.json'
import { LanguageHandler, Language } from '@tasenor/common'

class FinnishHandler implements LanguageHandler {

  languages: Partial<Record<Language, Record<string, string>>>

  constructor() {
    this.languages = {
      fi: FI as Record<string, string>
    }
  }

  getLanguages(): Set<Language> {
    return new Set(['fi'])
  }

  flag() {
    return 'fi'
  }

  date2str(date) {
    return dayjs(date).format('DD.MM.YYYY')
  }

  time2str(date) {
    return dayjs(date).format('HH.mm.ss')
  }

  str2date(str, sample: undefined | Date = undefined): string | undefined {
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

export default FinnishHandler
