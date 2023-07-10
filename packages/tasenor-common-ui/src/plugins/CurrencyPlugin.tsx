import { UiPlugin } from './UiPlugin'

/**
* A plugin providing translations for a language.
*/
export class CurrencyPlugin extends UiPlugin {

  /**
   * An utility function to convert numeric money value to localized string.
   * @param cents Amount given as integer of the smallest unit.
   * @param divider The value used to dived main unit to its smaller unit (i.e. usually 100)
   * @param decimals Number of decimals to show.
   * @param prefix Text before number.
   * @param thousands Thousand separator string.
   * @param comma A comma string.
   * @param postfix Text after number.
   * @returns
   */
  makeMoney(cents, divider, decimals, prefix, thousands, comma, postfix) {
    const [full, part] = (Number(cents / divider).toFixed(decimals)).split('.')

    let text = full.replace(/(\d+)(\d{9})$/, `$1${thousands}$2`)
    text = text.replace(/(\d+)(\d{6})$/, `$1${thousands}$2`)
    text = text.replace(/(\d+)(\d{3})$/, `$1${thousands}$2`)

    return prefix + text + comma + part + postfix
  }

  /**
   * Get the display UTF-8 symbol or string for the currency.
   */
  getCurrencySymbol() {
    throw new Error(`Currency plugin ${this.code} does not implement getCurrencySymbol().`)
  }

  /**
   * Get the 3 letter code for the currency.
   */
  getCurrencyCode() {
    throw new Error(`Currency plugin ${this.code} does not implement getCurrencyCode().`)
  }

  /**
   * Convert a money amount to localized string.
   * @param cents Amount given as integer of the smallest unit.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  money2str(cents) {
    throw new Error(`Currency plugin ${this.code} does not implement money2str().`)
  }
}
