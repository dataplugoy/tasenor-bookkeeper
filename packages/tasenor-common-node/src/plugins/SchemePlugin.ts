import { Currency, Language, SchemeName, TsvFilePath } from '@dataplug/tasenor-common'
import { BackendPlugin } from './BackendPlugin'

/**
 * A plugin providing one or more accounting schemes.
 */
export class SchemePlugin extends BackendPlugin {

  private schemes: Set<SchemeName>

  constructor(...schemes: SchemeName[]) {
    super()
    this.schemes = new Set(schemes)
  }

  /**
   * Check if this plugin has the given scheme.
   * @param code
   * @returns
   */
  hasScheme(code): boolean {
    return this.schemes.has(code)
  }

  /**
   * Get the paths to the accounting scheme .tsv files by its code name.
   * @param code
   */
  getSchemePaths(code, languae): TsvFilePath[] {
    throw new Error(`A class ${this.constructor.name} does not implement getScheme().`)
  }

  /**
   * Get the default settings for the new database.
   * @param  code
   * @returns
   */
  getSchemeDefaults(code): Record<string, unknown> {
    return {}
  }

  /**
   * Supported currencies.
   */
  supportedCurrencies(): Currency[] {
    return []
  }

  /**
   * Supported languages.
   */
  supportedLanguages(): Language[] {
    return []
  }
}
