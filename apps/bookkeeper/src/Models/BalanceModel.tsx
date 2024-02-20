import NavigationTargetModel from './NavigationTargetModel'
import { ID } from '@tasenor/common'
import PeriodModel from './PeriodModel'
import DatabaseModel from './DatabaseModel'

class BalanceModel extends NavigationTargetModel {

  declare account_id: ID
  declare debit: null | number
  declare credit: null | number
  declare total: null | number
  declare parent: PeriodModel

  constructor(parent, init = {}) {
    super(parent, {
      id: null,
      // The linked account this entry is affecting.
      account_id: null,
      // Sum of debits in cents.
      debit: null,
      // Sum of credits in cents.
      credit: null,
      // Balance amount in cents.
      total: null
    }, {}, init)
  }

  getSortKey() {
    return this.account && this.account.number
  }

  getId() {
    return 'Balance' + this.account_id
  }

  getObjectType() {
    return 'Balance'
  }

  getUrl() {
    return '/' + this.database.name + '/txs/' + this.period.id + '/' + this.account_id
  }

  /**
   * Follow the link of the child.
   */
  keyEnter() {
    const el = this.getElement()
    el && el.click()
    return { preventDefault: true }
  }

  /**
   * Get the period of this balance.
   */
  get period(): PeriodModel {
    return this.parent
  }

  /**
   * Get the database of this balance.
   */
  get database(): DatabaseModel {
    return this.period.database
  }

  /**
   * Get the account this balance applies.
   */
  get account() {
    return this.period.getAccount(this.account_id)
  }
}

export default BalanceModel
