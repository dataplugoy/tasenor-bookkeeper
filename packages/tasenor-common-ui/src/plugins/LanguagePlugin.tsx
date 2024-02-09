import { UiPlugin } from './UiPlugin'

/**
* A plugin providing translations for a language.
*/
export class LanguagePlugin extends UiPlugin {

  /**
   * Get a set of languages provided this plugin.
   */
  getLanguages() {
    throw new Error(`Plugin ${this.code} does not implement getLanguages().`)
  }

  /**
   * Get the flag code for the given language supported by the plugin.
   * @param language
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  flag(language) {
    return 'gb'
  }

  /**
   * Convert a date or datetime to the localized string based on the currently selected language.
   * @param date A date as a string YYYY-MM-DD or with time.
   * @return Year, month and day localized.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  date2str(date) {
    throw new Error(`A plugin ${this.code} does not implement date2str().`)
  }

  /**
   * Convert a date or datetime to the localized timestamp string based on the currently selected language.
   * @param date A date as a string YYYY-MM-DD or with time.
   * @return Year, month and day localized.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  time2str(date) {
    throw new Error(`A plugin ${this.code} does not implement time2str().`)
  }

  /**
   * Convert (possibly partial) localized date to 'YYYY-MM-DD'
   * @param date A local format of date - possibly without year and/or month.
   * @param sample A sample to use for filling in missing parts (default: today)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  str2date(date, sample = null) {
    throw new Error(`A plugin ${this.code} does not implement str2date().`)
  }
}
