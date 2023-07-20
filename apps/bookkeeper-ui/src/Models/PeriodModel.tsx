import { ID } from '@dataplug/tasenor-common'
import { runInAction } from 'mobx'
import ReportModel from './ReportModel'
import DocumentModel from './DocumentModel'
import Model from './Model'
import DatabaseModel from './DatabaseModel'

class PeriodModel extends Model {

  id: ID
  start_date: string
  end_date: string
  locked: boolean

  // All documents of this period.
  documentsByAccountId = {}
  // All known account balances of the period.
  balances = {}
  // All known documents of the period.
  documents = {}
  // All reports for the period.
  reportsByFormat = {}

  constructor(parent, init = {}) {
    super(parent, {
      id: null,
      // Starting date of the period as a string "YYYY-MM-DD".
      start_date: null,
      // Final date of the period as a string "YYYY-MM-DD".
      end_date: null,
      // If set, the period is locked and cannot be changed.
      locked: false,
    }, {
      documentsByAccountId: {},
      balances: {},
      documents: {},
      reportsByFormat: {},
    }, init)
  }

  getSortKey() {
    return this.start_date
  }

  getObjectType() {
    return 'Period'
  }

  async save(initText = undefined) {
    const data = { text: initText, ...this.toJSON() }
    return this.store.request('/db/' + this.db + '/period/' + (this.id || ''), this.id ? 'PATCH' : 'POST', data)
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

  /**
   * Create a document from the JSON-structure and append to this period.
   * @param {Object} data
   *
   * Data needs to be in the format
   * ```
   * {
   *   number: 123, // Optional
   *   date: "yyyy-mm-dd",
   *   entries: [{...}, ....]
   * }
   * ```
   * where entries are in the format required by `DocumentModel.createEntry()`.
   */
  async createDocument(data) {
    // Create document.
    const entries = data.entries || []
    delete data.entries
    const doc = new DocumentModel(this, { ...data, period_id: this.id })
    await doc.save()
    this.addDocument(doc)
    // Create entries.
    for (const entry of entries) {
      await doc.createEntry(entry)
    }
    return doc
  }

  /**
   * Append new or override old document for this period.
   * @param {DocumentModel} doc
   */
  addDocument(doc) {
    runInAction(() => {
      doc.parent = this
      doc.period_id = this.id
      this.documents[doc.id] = doc
      doc.entries.forEach((entry) => {
        this.addEntry(entry)
      })
    })
  }

  /**
   * Establish account linking with entry.
   * @param {EntryModel} entry
   */
  addEntry(entry) {
    if (!entry.document || !entry.document.id || !entry.account_id) {
      return
    }
    runInAction(() => {
      this.documentsByAccountId[entry.account_id] = this.documentsByAccountId[entry.account_id] || new Set()
      this.documentsByAccountId[entry.account_id].add(entry.document.id)
    })
  }

  /**
   * Remove a document from this period.
   * @param {DocumentModel} doc
   */
  deleteDocument(doc) {
    runInAction(() => {
      doc.entries.forEach((entry) => {
        if (this.documentsByAccountId[entry.account_id]) {
          this.documentsByAccountId[entry.account_id].delete(doc.id)
        }
      })
      delete this.documents[doc.id]
    })
  }

  /**
   * Remove an entry from this period.
   * @param {EntryModel} entry
   */
  deleteEntry(entry) {
    if (entry && entry.account_id && this.documentsByAccountId[entry.account_id]) {
      runInAction(() => {
        for (const docId of this.documentsByAccountId[entry.account_id]) {
          this.getDocument(docId).deleteEntry(entry)
        }
      })
    }
  }

  /**
   * Transfer an entry from one account to another account.
   * @param {Number} documentId
   * @param {Number} oldAccountId
   * @param {Number} accountId
   */
  changeAccount(documentId, oldAccountId, accountId) {
    this.documentsByAccountId[oldAccountId] = this.documentsByAccountId[oldAccountId] || new Set()
    this.documentsByAccountId[oldAccountId].delete(documentId)
    this.documentsByAccountId[accountId] = this.documentsByAccountId[accountId] || new Set()
    this.documentsByAccountId[accountId].add(documentId)
  }

  /**
   * Add new or override old balance for the given account.
   * @param {BalanceModel} balance
   */
  addBalance(balance) {
    balance.parent = this
    this.balances[balance.account_id] = balance
  }

  /**
   * Get balance by account ID.
   * @param {Number} accountId
   */
  getBalance(accountId) {
    return this.balances[accountId]
  }

  /**
   * Get balance by account number.
   * @param {String} number
   */
  getBalanceByNumber(number) {
    return this.getBalance(this.database.getAccountByNumber(number).id)
  }

  /**
   * Add a report for this period.
   * @param {ReportModel} report
   */
  addReport(report) {
    report.parent = this
    this.reportsByFormat[report.format] = report
  }

  /**
   * Get the report by its format.
   * @param {String} format
   */
  getReport(format) {
    return this.reportsByFormat[format] || null
  }

  /**
   * Get the document by its ID.
   * @param {Number} id
   * @return {null|DocumentModel}
   */
  getDocument(id) {
    return this.documents[id] || null
  }

  /**
   * Get the account by its ID.
   * @param {Number} id
   * @return {null|AccountModel}
   */
  getAccount(id) {
    return this.database.getAccount(id)
  }

  /**
   * Get all documents involving the given account.
   * @param {Number} accountId
   * @return {DocumentModel[]}
   */
  getAccountDocuments(accountId) {
    return [...(this.documentsByAccountId[accountId] || new Set())].map((id) => this.getDocument(id))
  }

  /**
   * Get currently loaded documents having entry for accounts and matching the filter.
   * @param {String[]} [accounts]
   * @param {Function<EntryModel>} [filter]
   * @return {DocumentModel[]}
   */
  getDocuments(accounts: null | string[] = null, filter: null | ((EntryModel) => boolean) = null) {
    let docs: DocumentModel[] = Object.values({ ...this.documents })
    if (accounts !== null) {
      docs = docs.filter((doc) => {
        for (const entry of doc.entries) {
          if (entry.account.number === null) {
            throw new Error(`Cannot use account ${JSON.stringify(entry.account)} without number.`)
          }
          if (accounts.includes(entry.account.number)) {
            return filter === null ? true : filter(entry)
          }
        }
        return false
      })
    }
    return docs
  }

  /**
   * Update tags for all accounts from the current documents.
   */
  refreshTags() {
    const tags = {}
    Object.values(this.documents).forEach((doc: DocumentModel) => {
      doc.entries.forEach((entry) => {
        // Skip new or broken entries.
        if (!entry.account_id) {
          return
        }
        tags[entry.account_id] = tags[entry.account_id] || new Set()
        entry.tagNames.forEach((tag) => tags[entry.account_id as number].add(tag))
      })
    })
    Object.keys(tags).forEach((accountId) => {
      this.getAccount(accountId).setTags([...tags[accountId]])
    })
  }

  /**
   * Lock the period.
   */
  lock() {
    this.store.request(`/db/${this.database.name}/period/${this.id}`, 'PATCH', { locked: 1 })
      .then(() => {
        runInAction(() => {
          this.locked = true
        })
      })
  }

  /**
   * Unlock the period.
   */
  unlock() {
    this.store.request(`/db/${this.database.name}/period/${this.id}`, 'PATCH', { locked: 0 })
      .then(() => {
        runInAction(() => {
          this.locked = false
        })
      })
  }

  /**
   * Get the database this period belongs to.
   */
  get database(): DatabaseModel {
    return this.parent as unknown as DatabaseModel
  }

  /**
   * Get reports for this period.
   */
  get reports() {
    return Object.values(this.reportsByFormat).sort(ReportModel.sorter())
  }
}

export default PeriodModel
