import AccountModel from './AccountModel'
import Model from './Model'
import PeriodModel from './PeriodModel'
import TagModel from './TagModel'

class DatabaseModel extends Model {

  declare name: string

  // All periods of this database.
  declare periodsById: Record<string, PeriodModel>

  // All accounts of this database.
  declare accountsById: Record<string, AccountModel>
  declare accountsByNumber: Record<string, AccountModel>

  // All tags of this database.
  declare tagsByTag: Record<string, TagModel>

  // All headings of this database.
  declare headingsByNumber

  constructor(parent, init = {}) {
    super(parent, {
      // Name of the database.
      name: null
    }, {
      // Additional bookkeeping.
      periodsById: {},
      accountsById: {},
      accountsByNumber: {},
      tagsByTag: {},
      headingsByNumber: {}
    }, init)
  }

  getSortKey() {
    return this.name
  }

  getObjectType() {
    return 'Database'
  }

  async delete() {
    const path = '/db/' + this.name
    return this.store.request(path, 'DELETE')
  }

  /**
   * Add new or override old period for this database.
   * @param {PeriodModel} period
   */
  addPeriod(period) {
    period.parent = this
    this.periodsById[period.id] = period
  }

  /**
   * Get the period by its ID.
   * @param {Number} id
   * @return {null|PeriodModel}
   */
  getPeriod(id): null | PeriodModel {
    return this.periodsById[id] || null
  }

  /**
   * Find the period for the given date.
   * @param date
   */
  periodOf(date) {
    for (const period of this.periods) {
      if (period.start_date <= date && period.end_date >= date) {
        return period
      }
    }
    return null
  }

  /**
   * Find the period for the given date and if not found, create one dummy unsaved period.
   */
  getOrCreatePeriod(date) {
    let period = this.periodOf(date)
    if (!period) {
      period = new PeriodModel(this, {
        id: null,
        start_date: `${date}`.substring(0, 4) + '-01-01',
        end_date: `${date}`.substring(0, 4) + '-12-31',
        locked: false
      })
    }
    return period
  }

  /**
   * Add new or override old account for this database.
   * @param {AccountModel} account
   */
  addAccount(account) {
    account.parent = this
    this.accountsById[account.id] = account
    this.accountsByNumber[account.number] = account
  }

  /**
   * Add new or override old tag for this database.
   * @param {TagModel} tag
   */
  async addTag(tag) {
    if (tag instanceof TagModel) {
      tag.parent = this
    } else {
      tag = new TagModel(this, tag)
    }
    this.tagsByTag[tag.tag] = tag
    return tag
  }

  /**
   * Delete tag from this database.
   * @param {TagModel} tag
   */
  deleteTag(tag) {
    const newCollection = Object.keys(this.tagsByTag).filter(key => key !== tag.tag).reduce((prev, cur) => ({ ...prev, [cur]: this.tagsByTag[cur] }), {})
    this.tagsByTag = newCollection
  }

  /**
   * Update old tag for this database.
   * @param {AccountModel} account
   */
  updateTag(tag) {
    tag.parent = this
    this.tagsByTag[tag.tag] = tag
  }

  /**
   * Add new or override old heading for this database.
   * @param {HeadingModel} heading
   */
  addHeading(heading) {
    heading.parent = this
    this.headingsByNumber[heading.number] = this.headingsByNumber[heading.number] || []
    this.headingsByNumber[heading.number].push(heading)
  }

  /**
   * Look from the account list the account collecting profit.
   */
  getProfitAccount() {
    for (const account of Object.values(this.accountsById)) {
      if (account.type === 'PROFIT_PREV') {
        return account
      }
    }
  }

  /**
   * Create new period with initial balances taken from the latest period.
   */
  async createNewPeriod(startDate, endDate, initText) {
    const period = new PeriodModel(this, {
      start_date: startDate,
      end_date: endDate
    })
    await period.save(initText)
  }

  /**
   * Check if the given tag is defined.
   * @param {String} tag
   * @return {Boolean}
   */
  hasTag(tag) {
    return !!this.tagsByTag[tag]
  }

  /**
   * Get the tag by its code.
   * @param {String} tag
   */
  getTag(tag) {
    return this.tagsByTag[tag] || null
  }

  /**
   * Get the account by its ID.
   * @param {Number} id
   * @return {null|AccountModel}
   */
  getAccount(id) {
    return this.accountsById[id] || null
  }

  /**
   * Clear all accounts.
   */
  deleteAccounts() {
    this.accountsById = {}
    this.accountsByNumber = {}
  }

  /**
   * Get the account by its number.
   * @param {Number} number
   * @return {null|AccountModel}
   */
  getAccountByNumber(number) {
    return this.accountsByNumber[number] || null
  }

  /**
   * Check if there is an account with the given number.
   * @param {Number} number
   * @return {Boolean}
   */
  hasAccount(number): boolean {
    return this.getAccountByNumber(number.toString()) !== null
  }

  /**
   * Check if this database has accounts loaded.
   * @return {Boolean}
   */
  hasAccounts(): boolean {
    return Object.keys(this.accountsById).length > 0
  }

  /**
   * Get periods of this database.
   */
  get periods(): PeriodModel[] {
    return Object.values(this.periodsById)
  }

  /**
   * Get the headings data.
   */
  get headings() {
    return this.headingsByNumber
  }
}

export default DatabaseModel
