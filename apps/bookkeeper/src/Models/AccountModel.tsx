import { Currency, Language } from '@tasenor/common'
import { runInAction } from 'mobx'
import DatabaseModel from './DatabaseModel'
import Model from './Model'
import TagModel from './TagModel'

class AccountModel extends Model {

  declare number: null | string
  declare name: null | string
  declare type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'PROFIT_PREV' | 'PROFIT'
  declare currency: undefined | Currency
  declare language: undefined | Language
  declare data: Record<string, unknown>
  declare parent: DatabaseModel

  // Tags found from transactions of this account.
  declare tagsByTag
  // Period statistics for this account (if loaded).
  declare periods

  constructor(parent, init = {}) {
    super(parent, {
      id: null,
      // Account number as a string.
      number: null,
      // Name of the account.
      name: null,
      // "ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE/PROFIT_PREV/PROFIT"
      type: null,
      // Currency.
      currency: undefined,
      // Language.
      language: undefined,
      // Additional attributes.
      data: {}
    }, {
      tagsByTag: {},
      periods: []

    }, init)
  }

  toString() {
    return `${this.number} ${this.name}`
  }

  getSortKey() {
    return this.number
  }

  getUrl() {
    return '/' + this.database.name + '/txs/' + this.store.period.id + '/' + this.id
  }

  getObjectType() {
    return 'Account'
  }

  async save() {
    if (!this.data.code) {
      runInAction(() => {
        delete this.data.code
      })
    }
    if (!this.id) {
      runInAction(() => {
        this.language = this.settings.get('language') as Language
        this.currency = this.settings.get('currency') as Currency
      })
    }
    return this.store.request('/db/' + this.db + '/account/' + (this.id || ''), this.id ? 'PATCH' : 'POST', this.toJSON())
      .then((res) => {
        runInAction(() => {
          if (!this.id) {
            this.id = res.id
          }
        })
        this.store.invalidateReport()
        return res
      })
  }

  async delete() {
    const path = '/db/' + this.db + '/account/' + this.id
    return this.store.request(path, 'DELETE')
      .then(() => {
        this.store.invalidateReport()
        return this.store.fetchAccounts(this.db)
      })
  }

  /**
   * Set tags for this account.
   * @param {String[]} tags
   */
  setTags(tags) {
    this.tagsByTag = {}
    tags.forEach((tagName) => {
      const tag = this.database.getTag(tagName)
      if (!tag) {
        console.error(`Cannot find tag '${tagName}' for account ${this.toString()}.`)
        return
      }
      this.tagsByTag[tag.tag] = tag
    })
  }

  /**
   * Get tag by its code.
   * @param {String} tag
   */
  getTag(tag) {
    return this.tagsByTag[tag] || null
  }

  /**
   * Set or clear a flag.
   * @param {String} name
   * @param {Boolean} value
   */
  setFlag(name, value) {
    this.data[name] = !!value
  }

  /**
   * Get a value of a flag.
   * @param {String} name
   */
  getFlag(name) {
    return !!this.data[name]
  }

  get database(): DatabaseModel {
    return this.parent
  }

  get tags() {
    return Object.values(this.tagsByTag).sort(TagModel.sorter())
  }

  get FAVOURITE() { return this.getFlag('favourite') }
  set FAVOURITE(value) { this.setFlag('favourite', value) }
}

export default AccountModel
