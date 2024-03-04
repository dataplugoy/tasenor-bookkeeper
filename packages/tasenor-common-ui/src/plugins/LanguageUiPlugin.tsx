import { Language, LanguageHandler } from '@tasenor/common'
import { UiPlugin } from '.'

/**
* A plugin providing translations for a language in UI.
*/
export class LanguageUiPlugin extends UiPlugin {
  handler: LanguageHandler

  constructor(handler: LanguageHandler) {
    super()
    this.handler = handler
    this.languages = handler.languages
  }

  getLanguages(): Set<Language> { return this.handler.getLanguages() }
  flag(language: Language) { return this.handler.flag(language) }
  date2str(date): string { return this.handler.date2str(date) }
  time2str(date): string { return this.handler.time2str(date) }
  str2date(date, sample: Date | undefined): string | undefined { return this.handler.str2date(date, sample) }
}

// TODO: Remove once staging updated.
export class LanguagePlugin extends LanguageUiPlugin {}
