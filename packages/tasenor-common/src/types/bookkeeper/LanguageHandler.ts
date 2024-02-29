import { Language } from '..'

/**
* A handler providing translations for a language.
*/
export interface LanguageHandler {

  /**
   * Languages loaded from JSON.
   */
  languages: Partial<Record<Language, Record<string, string>>>

  /**
   * Get a set of languages provided this plugin.
   */
  getLanguages(): Set<Language>

  /**
   * Get the flag code for the given language supported by the plugin.
   * @param language
   */
  flag(language: Language)

  /**
   * Convert a date or datetime to the localized string based on the currently selected language.
   * @param date A date as a string YYYY-MM-DD or with time.
   * @return Year, month and day localized.
   */
  date2str(date): string

  /**
   * Convert a date or datetime to the localized timestamp string based on the currently selected language.
   * @param date A date as a string YYYY-MM-DD or with time.
   * @return Year, month and day localized.
   */
  time2str(date): string

  /**
   * Convert (possibly partial) localized date to 'YYYY-MM-DD'
   * @param date A local format of date - possibly without year and/or month.
   * @param sample A sample to use for filling in missing parts (default: today)
   */
  str2date(date, sample: Date | undefined): string | undefined
}
