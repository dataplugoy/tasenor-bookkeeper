import { UiPlugin } from './UiPlugin'

/**
 * A plugin providing accounting schemes.
 */
export class SchemePlugin extends UiPlugin {

  /**
   * Gather accounting schemes provided by this plugin.
   * @returns A map from accounting scheme code names to their visual titles.
   */
  getAccountingSchemes() {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  }

  /**
   * Get the data from the .tsv file.
   * @returns
   */
  getAccountData() {
    return []
  }
}
