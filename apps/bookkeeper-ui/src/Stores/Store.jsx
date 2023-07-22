import { runInAction, computed, observable, makeObservable, action } from 'mobx'
import AccountModel from '../Models/AccountModel'
import DatabaseModel from '../Models/DatabaseModel'
import PeriodModel from '../Models/PeriodModel'
import DocumentModel from '../Models/DocumentModel'
import EntryModel from '../Models/EntryModel'
import BalanceModel from '../Models/BalanceModel'
import TagModel from '../Models/TagModel'
import HeadingModel from '../Models/HeadingModel'
import ReportModel from '../Models/ReportModel'
import i18n from '../i18n'
import jwtDecode from 'jwt-decode'
import { error, net, TOKEN_EXPIRY_TIME, waitPromise, Crypto } from '@dataplug/tasenor-common'
import Configuration from '../Configuration'
import ImporterModel from '../Models/ImporterModel'

const DEBUG = false
let NEXT_MESSAGE_ID = 1

const debug = (...args) => DEBUG && console.log.apply(console, args)

/**
 * The store structure is the following:
 * {
 *   token: null,
 *   messages: [
 *     { id: 1, text: 'This is alert.' }
 *   ],
 *   dbsByName: {
 *     foo: {
 *       name: "foo"
 *       accountsById: {
 *         123: {
 *           id: 123,
 *           name: "Muiden vapaaehtoisten varausten muutos",
 *           number: "9890",
 *           type: "EXPENSE",
 *           tags: ["Tag1", "Tag2"],
 *         }
 *       },
 *       periodsById: {
 *         1: {
 *           id: 1,
 *           start_date "2017-01-01",
 *           end_date "2017-12-31"
 *         }
 *       },
 *       tags: {
 *         "Tag":
 *           id: 1,
 *           tag: "Tag",
 *           name: "Tag description",
 *           picture: "https://site.to.store/picture",
 *           type: "Category",
 *           order: 102,
 *       },
 *       headings: {
 *         "1001": [{
 *           "text": "Vastaavaa",
 *           "level": 0
 *         },...]
 *       }
 *     }
 *   },
 *   db: 'foo',                // Currently selected db
 *   periodId: 1,              // Currently selected period
 *   accountId: 123,           // Currently selected account
 *   report: ReportModel(...), // Latest report fetched
 *   lastDate: "2018-01-01",   // Latest date entered by user.
 *   tools: {                  // Tool panel selections.
 *     tagDisabled: {
 *       Tag1: true,
 *       Tag2: false
 *     }
 *   },
 *   user: {
 *     name: 'User name',
 *     email: 'user@localhost'
 *   },
 *   users: [{
 *   }]
 * }
 */
export class Store {

  db = null
  loading = false
  messages = []
  periodId = null
  accountId = null
  changed = false
  dbsByName = null
  lastDate = null
  report = null
  token = null
  isAdmin = false
  isSuperuser = false
  tools = { tagDisabled: {}, accounts: {} }
  users = []
  user = {}
  motd = null

  // Cache for account descriptions list.
  entryDescriptions = {}
  // We are busy refreshing token.
  busy = false

  constructor(settings) {
    this.settings = settings
    this.catalog = null
    makeObservable(this, {
      db: observable,
      loading: observable,
      messages: observable,
      periodId: observable,
      accountId: observable,
      changed: observable,
      dbsByName: observable,
      lastDate: observable,
      report: observable,
      token: observable,
      isAdmin: observable,
      isSuperuser: observable,
      tools: observable,
      users: observable,
      user: observable,
      motd: observable,
      setTokens: action,
      request: action,
      fetchDatabases: action,
      setDb: action,
      setPeriod: action,
      setAccount: action,
      clearDb: action,
      clearPeriod: action,
      clearAccount: action,
      fetchSettings: action,
      fetchPeriods: action,
      fetchPeriodData: action,
      fetchTags: action,
      fetchAccounts: action,
      fetchEntryProposals: action,
      fetchHeadings: action,
      fetchImporters: action,
      fetchImporter: action,
      fetchReports: action,
      fetchReport: action,
      fetchBalances: action,
      fetchDocuments: action,
      fetchRawDocument: action,
      login: action,
      logout: action,
      createDatabase: action,
      invalidateReport: action,
      uploadImportFiles: action,
      fetchCurrentUser: action,
      filteredTransactions: computed,
      transactions: computed,
      dbs: computed,
      database: computed,
      period: computed,
      periods: computed,
      balances: computed,
      account: computed,
      accounts: computed,
      headings: computed,
      reports: computed,
      documents: computed,
    })

    this.setTokens(null, window.localStorage.getItem('token'))
    net.configure({
      baseUrl: Configuration.UI_API_URL,
    })
    this.refreshToken()
    setInterval(async () => this.refreshToken(), 1000 * TOKEN_EXPIRY_TIME / 2)
  }

  /**
   * Link to catalog.
   */
  setCatalog(catalog) {
    this.catalog = catalog
  }

  /**
   * Fetch and update tokens.
   */
  async refreshToken() {
    if (this.isLoggedIn() && !this.busy) {
      this.busy = true
      const resp = await net.refresh(Configuration.UI_API_URL)
      if (resp) {
        this.setTokens(resp.token, resp.refresh)
      } else {
        this.setTokens(null, null, true)
      }
      this.busy = false
    }
  }

  /**
   * Set access tokens for the backend and ui server.
   * @param token
   * @param refresh
   * @param clear If set, clear tokens.
   * @returns
   */
  setTokens(token, refresh, clear = false) {
    runInAction(() => {
      this.token = null
      this.isAdmin = false
      this.isSuperuser = false
    })

    const backendConf = {
      refreshUrl: '/auth/refresh',
      logout: () => {
        this.logout()
      }
    }

    const uiConf = {
    }

    if (token) {
      backendConf.token = token
      uiConf.token = token

      runInAction(() => {
        this.token = token
        const data = jwtDecode(token).data
        this.isAdmin = !!data.feats.ADMIN
        this.isSuperuser = !!data.feats.SUPERUSER
        this.catalog.refreshPluginList()
      })
    }

    if (refresh) {
      backendConf.refreshToken = refresh
      window.localStorage.setItem('token', refresh)
    }

    if (clear) {
      backendConf.token = null
      uiConf.token = null
      backendConf.refreshToken = null
      window.localStorage.removeItem('token')
    }
    // Configure backend.
    net.configure({
      sites: {
        [Configuration.UI_API_URL]: backendConf
      }
    })
    // Configure UI server.
    const uiUrl = new URL(document.location).origin
    net.configure({
      sites: {
        [uiUrl]: uiConf
      }
    })
  }

  /**
   * Store persistent client data.
   */
  setClientData(key, data) {
    if (key) {
      window.localStorage.setItem('key', key)
      window.localStorage.setItem('data', data)
    } else {
      window.localStorage.removeItem('key')
      window.localStorage.removeItem('data')
    }
  }

  /**
   * Get the persistent client data.
   */
  getClientData() {
    const key = window.localStorage.getItem('key')
    const data = window.localStorage.getItem('data')
    if (!key) {
      return null
    }
    // TODO: Async.
    console.error('ASYNC NOT IMPLEMENTED')
    return JSON.parse(Crypto.decrypt(key, data))
  }

  /**
   * Make a HTTP request to the back-end.
   * @param {String} path
   * @param {String} method
   * @param {Object|null|undefined} data
   * @param {File} file
   * @param {Boolean} noDimming
   */
  async request(path, method = 'GET', data = null, file = null, noDimming = false) {
    while (this.busy) {
      await waitPromise(100)
    }
    let url = Configuration.UI_API_URL + path
    if (/^ui:\//i.test(path)) {
      url = new URL(document.location).origin + new URL(path).pathname
    }
    let headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
    if (file !== null) {
      data = new FormData()
      data.set('file', file)
      headers = {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    }

    debug('  Request:', method, url, data || '')

    runInAction(() => {
      this.loading = !noDimming
    })
    const res = await net[method](url, data, headers)

    runInAction(() => {
      this.loading = false
    })
    if (res.success) {
      return res.status === 200 ? res.data : true
    }
    error(`HTTP ${res.status} ${res.message}`)

    switch (res.status) {
      case 401:
        this.addError(i18n.t('Invalid credentials.'))
        this.logout()
        setTimeout(() => (document.location = '/'), 2000)
        break
      case 403:
        if (!this.expiredMessageShown) {
          this.expiredMessageShown = true
          if (res.message) {
            this.addError(i18n.t(res.message))
          } else {
            this.addError(i18n.t('Session expired or invalid.'))
          }
        }
        this.logout()
        setTimeout(() => (document.location = '/'), 2000)
        break
      default:
        if (res.message && res.status !== 500) {
          this.addError(i18n.t(res.message))
        } else {
          this.addError(i18n.t('There was a problem fetching data.'))
        }
    }
  }

  /**
   * Get the list of available databases.
   */
  async fetchDatabases(force = false) {
    if (!this.token) {
      return
    }
    if (!force && this.dbsByName !== null) {
      return
    }
    if (!this.dbsFetch) {
      this.dbsFetch = this.request('/db')
        .then(data => {
          runInAction(() => {
            this.dbsByName = {}
            if (data) {
              data.forEach((db) => {
                const model = new DatabaseModel(this, db)
                this.dbsByName[model.name] = model
              })
            }
          })
          this.dbsFetch = null
        })
    }
    return this.dbsFetch
  }

  /**
  * Set the current database.
  * @param {String} db
  * @return {Promise}
  */
  async setDb(db) {
    db = db || null
    if (this.db === db) {
      debug('SetDb:', db, 'using old')
      return
    }
    await this.fetchDatabases()
    if (!db) {
      return
    }
    if (!this.dbFetch) {
      debug('SetDb', db, 'fetching...')
      this.dbFetch = this.fetchSettings(db)
        .then(() => this.fetchPeriods(db))
        .then(() => this.fetchReports(db))
        .then(() => this.fetchTags(db))
        .then(() => this.fetchHeadings(db))
        .then(() => this.fetchAccounts(db))
        .then(() => runInAction(() => (this.dbFetch = null)))
        .then(() => runInAction(() => (this.db = db)))
        .then(() => debug('SetDb', db, 'Done'))
    } else {
      debug('SetDb', db, 'sharing...')
    }
    return this.dbFetch
  }

  /**
  * Set the current period.
  * @param {String} db
  * @param {Number} periodId
  * @return {Promise}
  */
  async setPeriod(db, periodId) {
    periodId = parseInt(periodId) || null
    if (this.db === db && this.periodId === periodId) {
      debug('SetPeriod:', db, periodId, 'using old')
      return
    }
    await this.setDb(db)
    if (!periodId) {
      runInAction(() => (this.periodId = null))
      return
    }
    if (!this.periodFetch) {
      debug('SetPeriod:', db, periodId, 'fetching...')
      this.invalidateReport()
      // Pass though and share the same promise.
      this.periodFetch = this.fetchBalances(db, periodId)
        .then(() => runInAction(() => (this.periodId = periodId)))
        .then(() => this.fetchDocuments(db, periodId))
        .then(() => runInAction(() => (this.periodFetch = null)))
        .then(() => debug('SetPeriod', db, periodId, 'Done'))
    } else {
      debug('SetPeriod:', db, periodId, 'sharing...')
    }
    return this.periodFetch
  }

  /**
  * Set the current period.
  * @param {String} db
  * @param {Number} periodId
  * @return {Promise}
  */
  async setAccount(db, periodId, accountId) {
    if (accountId === '') {
      return
    }
    periodId = parseInt(periodId) || null
    accountId = parseInt(accountId) || null
    if (this.db === db && this.periodId === periodId && this.accountId === accountId) {
      debug('SetAccount:', db, periodId, accountId, 'using old')
      return
    }
    await this.setPeriod(db, periodId)
    // Fetch additional data for an account.
    return this.request('/db/' + db + '/account/' + accountId)
      .then((account) => {
        runInAction(() => {
          this.accountId = accountId
          this.account.periods.replace(account.periods)
          debug('SetAccount:', db, periodId, accountId, 'Done')
        })
      })
  }

  /**
  * Clear DB data.
  */
  clearDb() {

    this.db = null
    this.report = null
    this.settings.reset()
    this.clearPeriod()
  }

  /**
  * Clear period data.
  */
  clearPeriod() {

    this.periodId = null
    this.report = null
    this.clearAccount()
  }

  /**
  * Clear period data.
  */
  clearAccount() {

    this.accountId = null
    this.tools = {
      tagDisabled: {
      },
      accounts: {
      }
    }
  }

  /**
  * Get the settings from the system and possibly current DB.
  */
  async fetchSettings(db = null) {
    const settings = db && this.token ? await this.request('/db/' + db + '/settings') : {}
    const system = await this.request('/system/settings')
    if (this.isAdmin) {
      const plugins = await this.request('/system/settings/plugins')
      this.settings.updatePlugins(plugins)
    }
    runInAction(() => {
      this.settings.updateSystem(system)
      this.settings.update(settings)
    })
  }

  /**
   * Update one or more setting values.
   */
  async updateSettings(db, values) {
    if (!this.token) {
      return
    }
    if (!db) {
      // Backend plugins.
      return this.request('/system/settings/plugins', 'PATCH', values)
        .then(() => {
          runInAction(() => {
            this.settings.updatePlugin(values)
          })
        })
    }
    // UI plugins.
    return this.request('/db/' + db + '/settings', 'PATCH', values)
      .then(() => {
        runInAction(() => {
          this.settings.update(values)
        })
      })
  }

  /**
  * Get the list of periods available for the current DB.
  */
  async fetchPeriods(db) {
    if (!this.token) {
      return
    }
    return this.request('/db/' + db + '/period')
      .then((periods) => {
        runInAction(() => {
          periods.forEach((data) => {
            this.dbsByName[db].addPeriod(new PeriodModel(this.dbsByName[db], data))
          })
        })
      })
  }

  /**
  * Get the period data inclding stock data for the period.
  */
  async fetchPeriodData(db, periodId) {
    if (!this.token) {
      return
    }
    return this.request('/db/' + db + '/period/' + periodId + '?data')
  }

  /**
  * Get the tag definitions from the current database.
  */
  async fetchTags(db) {
    if (!this.token) {
      return
    }
    return this.request('/db/' + db + '/tags')
      .then((tags) => {
        runInAction(async () => {
          for (const tag of tags) {
            await this.dbsByName[db].addTag(new TagModel(this.dbsByName[db], tag))
          }
        })
      })
  }

  /**
  * Collect all accounts.
  */
  async fetchAccounts(db) {
    if (!this.token) {
      return
    }
    return this.request('/db/' + db + '/account')
      .then((accounts) => {
        runInAction(() => {
          this.dbsByName[db].deleteAccounts()
          accounts.forEach((data) => {
            const account = new AccountModel(this.dbsByName[db], data)
            this.dbsByName[db].addAccount(account)
          })
        })
      })
  }

  /**
  * Fetch all historical descriptions given for entries of the given account.
  * @param {String} db
  * @param {Number} accountId
  * @return {String[]}
  */
  async fetchEntryProposals(db, accountId) {
    if (!this.token) {
      return
    }
    if (this.entryDescriptions[db] && this.entryDescriptions[db][accountId]) {
      return this.entryDescriptions[db][accountId]
    }
    return this.request('/db/' + db + '/entry?account_id=' + accountId, 'GET', null, null, true)
      .then((res) => {
        const ret = res.map(e => ({
          documentId: e.document_id,
          description: e.description,
          debit: e.debit ? e.amount : null,
          credit: e.debit ? null : e.amount
        }))
        this.entryDescriptions[db] = this.entryDescriptions[db] || {}
        this.entryDescriptions[db][accountId] = ret
        return ret
      })

  }

  /**
  * Collect all account headings.
  */
  async fetchHeadings(db) {
    if (!this.token) {
      return
    }
    return this.request('/db/' + db + '/heading')
      .then((headings) => {
        runInAction(() => {
          headings.forEach((heading) => {
            this.dbsByName[db].addHeading(new HeadingModel(this.dbsByName[db], heading))
          })
        })
      })
  }

  /**
   * Get all importer configurations
   * @param db
   * @returns
   */
  async fetchImporters(db) {
    if (!this.token) {
      return
    }
    return this.request('/db/' + db + '/importer')
  }

  /**
   * Get one importer configuration
   * @param db
   * @returns
   */
  async fetchImporter(db, importerId) {
    if (!this.token) {
      return
    }
    const data = await this.request('/db/' + db + '/importer/' + importerId)
    return new ImporterModel(this.database, data)
  }

  /**
  * Get the list of report formats available for the current DB.
  */
  async fetchReports(db) {
    if (!this.token) {
      return
    }
    return this.request('/db/' + db + '/report')
      .then((reports) => {
        runInAction(() => {
          Object.keys(reports.options).forEach((format, idx) => {
            const opts = { format, order: idx, options: reports.options[format] || {} }
            this.dbsByName[db].periods.forEach((period) => period.addReport(new ReportModel(period, opts)))
          })
        })
      })
  }

  /**
  * Get the report data.
  */
  async fetchReport(db, periodId, format) {
    await this.setPeriod(db, periodId)
    if (!this.period || !format) {
      return
    }
    const report = this.period.getReport(format)
    const url = report.getUrl()
    if (this.report && this.report.url === url) {
      return
    }
    runInAction(() => {
      this.report = null
      report.setData(url, [])
    })

    return this.request(url)
      .then((data) => {
        runInAction(() => {
          report.setData(url, data)
          this.report = report
        })
      })
  }

  /**
  * Get the summary of balances for all accounts in the given period.
  */
  async fetchBalances(db = null, periodId = null) {
    if (!this.token) {
      return
    }
    if (!db) {
      db = this.db
    }
    if (!periodId) {
      periodId = this.periodId
    }
    if (!periodId) {
      return
    }
    return this.request('/db/' + db + '/period/' + periodId)
      .then((balances) => {
        runInAction(() => {
          const period = this.dbsByName[db].getPeriod(periodId)
          period.balances = {}
          balances.balances.forEach((data) => {
            period.addBalance(new BalanceModel(period, { account_id: data.id, ...data }))
          })
        })
      })
  }

  /**
  * Get the documents with entries for the given period.
  */
  async fetchDocuments(db = null, periodId = null) {
    if (!this.token) {
      return
    }
    if (!db) {
      db = this.db
    }
    if (!periodId) {
      periodId = this.periodId
    }
    return this.request('/db/' + db + '/document?entries&period=' + periodId)
      .then((data) => {
        runInAction(() => {
          let lastDate
          data.forEach((tx) => {
            const doc = new DocumentModel(this.period, tx)
            this.period.addDocument(doc)
            lastDate = tx.date
          })
          this.period.refreshTags()
          this.lastDate = lastDate
        })
      })
  }

  /**
  * Get a single document raw data without caching.
  */
  async fetchRawDocument(documentId) {
    if (!this.token) {
      return
    }
    return this.request('/db/' + this.db + '/document/' + documentId)
  }

  /**
  * Login to the back-end.
  * @param {String} user
  * @param {String} password
  */
  async login(user, password) {
    this.token = null
    const resp = await this.request('/auth', 'POST', { user, password })
    if (resp && resp.token) {
      runInAction(() => {
        if (resp.motd) {
          this.motd = i18n.t(resp.motd)
        }
        this.setClientData(resp.key, resp.data)
        this.setTokens(resp.token, resp.refresh)
      })

      await this.fetchSettings()
      await this.fetchDatabases()
      await this.fetchCurrentUser()

      return true
    }
  }

  /**
  * Log out the current user.
  */
  logout() {
    this.setTokens(null, null, true)
    this.setClientData(null, null)
    this.motd = null
    this.token = null
    this.user = null
    this.isAdmin = false
    this.isSuperuser = false
    this.catalog.refreshPluginList()
    this.dbsByName = null
    this.db = null
    this.periodId = null
    this.clearDb()
  }

  /**
   * Check if user is logged in.
   */
  isLoggedIn() {
    return !!window.localStorage.getItem('token')
  }

  /**
  * Create new database.
  * @param info.databaseName
  * @param info.companyName
  * @param info.companyCode
  * @param info.scheme
  */
  createDatabase(info) {
    info.language = i18n.language
    return this.request('/db', 'POST', info)
      .then(async (res) => {
        await this.fetchDatabases(true)
        this.clearAccount()
        return res
      })
  }

  /**
  * Remove the report, since it may not be valid anymore.
  */
  invalidateReport() {
    if (this.report) {
      this.report = null
    }
  }

  /**
   * Upload files to the import end point.
   * @param files
   */
  async uploadImportFiles(importerId, args) {
    return this.request('/db/' + this.db + '/importer/' + importerId, 'POST', args)
  }

  /**
  * Computed property to collect only transactions matching the current filter.
  */
  get filteredTransactions() {
    const visible = (tx) => {
      const allEnabled = Object.values(this.tools.tagDisabled).filter((v) => v).length === 0
      if (!tx.tags || !tx.tags.length) {
        return allEnabled
      }
      let disabled = true
      tx.tags.forEach((tag) => {
        if (!this.tools.tagDisabled[tag.tag]) {
          disabled = false
        }
      })
      return !disabled
    }

    const filter = (txs) => {
      return txs.filter((tx) => visible(tx))
    }

    return filter(this.transactions)
  }

  /**
   * Get currently loaded documents having entry for accounts and matching the filter.
   * @param {String[]} [accounts]
   * @param {Function<EntryModel>} [filter]
   * @return {DocumentModel[]}
   */
  getDocuments(accounts = null, filter = null) {
    if (!this.period) {
      return []
    }
    return this.period.getDocuments(accounts, filter)
  }

  /**
     * Fill in users table (admin only).
     */
  async getUsers() {
    return this.request('/admin/user')
      .then((users) => {
        runInAction(() => this.users.replace(users))
      })
  }

  /**
   * Find the given user that has been already loaded.
   */
  getUser(email) {
    return this.users.find(u => u.email === email)
  }

  /**
     * Delete user from the system.
     * @param {User} user
     */
  async deleteUser(user) {
    const path = '/admin/user/' + user.email
    return this.request(path, 'DELETE')
  }

  /**
   * Append an error message to the snackbar.
   * @param {String} text
   */
  addError(text) {
    const id = NEXT_MESSAGE_ID++
    const message = { id, text, type: 'error' }
    runInAction(() => this.messages.push(message))
    setTimeout(() => this.removeMessage(message), 5000)
  }

  /**
   * Append normal message to the snackbar.
   * @param {String} text
   */
  addMessage(text) {
    const id = NEXT_MESSAGE_ID++
    const message = { id, text, type: 'info' }
    runInAction(() => this.messages.push(message))
    setTimeout(() => this.removeMessage(message), 5000)
  }

  /**
   * Remove a message from the current list.
   */
  removeMessage(message) {
    runInAction(() => this.messages.replace(this.messages.filter(m => m.id !== message.id)))
  }

  /**
   * Remove all messages.
   */
  clearMessages() {
    runInAction(() => this.messages.replace([]))
  }

  /**
   * Get a list of all entries for the currently selected account of the current period.
   */
  get transactions() {
    if (this.periodId && this.accountId && this.period) {
      let ret = []
      let docs = this.period.getAccountDocuments(this.accountId)
      docs = docs.sort(DocumentModel.sorter())
      docs.forEach((doc) => {
        ret = ret.concat(doc.entries.filter((e) => e.account_id === this.accountId))
      })
      return ret.sort(EntryModel.sorter())
    }
    return []
  }

  /**
   * Get a list of dbs.
   */
  get dbs() {
    return this.dbsByName ? Object.values(this.dbsByName).sort(DatabaseModel.sorter(true)) : []
  }

  /**
   * Get the current database.
   */
  get database() {
    return this.dbsByName ? this.dbsByName[this.db] || null : null
  }

  /**
   * Get the current period.
   */
  get period() {
    if (!this.database || !this.periodId) {
      return null
    }
    return this.database.periodsById[this.periodId]
  }

  /**
   * Get a list of periods sorted by their starting date.
   */
  get periods() {
    if (!this.database) {
      return []
    }
    return Object.values(this.database.periodsById).sort(PeriodModel.sorter(true))
  }

  /**
   * Get a list of balances for the current period.
   */
  get balances() {
    if (this.periodId && this.period) {
      return Object.values(this.period.balances).sort(BalanceModel.sorter())
    }
    return []
  }

  /**
   * Get the currently selected account if any.
   */
  get account() {
    if (this.accountId && this.database) {
      return this.database.accountsById[this.accountId] || null
    }
    return null
  }

  /**
   * Get a list of available accounts sorted by their number.
   */
  get accounts() {
    if (!this.database) {
      return []
    }
    const accounts = Object.values(this.database.accountsById).filter(account => {
      if (!account.data.plugin) {
        return true
      }
      const balance = this.period && this.period.balances && this.period.getBalance(account.id) !== undefined
      if (balance) {
        return true
      }
      return this.catalog.isAvailable(account.data.plugin)
    })
    return accounts.sort(AccountModel.sorter())
  }

  /**
   * Get headings data from database
   */
  get headings() {
    return this.database ? this.database.headings : {}
  }

  /**
   * Get reports for the current period.
   */
  get reports() {
    return this.period ? this.period.reports : []
  }

  /**
   * Get all documents for the current period.
   */
  get documents() {
    return this.period ? this.period.getDocuments() : []
  }

  /**
     * Get the history access from catalog.
     */
  get history() {
    return this.catalog.history
  }

  /**
   * Get the user information from the DB.
   */
  async fetchCurrentUser() {
    if (!this.token) {
      return
    }
    if (this.user && Object.keys(this.user).length) {
      return
    }
    return this.request('/admin/user/current-user')
      .then((user) => {
        runInAction(() => {
          this.user = user
        })
      })
  }

  /**
     * Subscribe to the plugin.
     * @param code
     */
  async subscribe(code) {
    return this.request('/subscriptions', 'POST', { code })
      .then((resp) => {
        runInAction(() => {
          if (resp) {
            this.setClientData(resp.data.key, resp.data.data)
            this.catalog.refreshPluginList()
          }
        })
      })
  }

  /**
     * Unsubscribe plugin
     * @param code
     */
  async unsubscribe(code) {
    return this.request(`/subscriptions/${code}`, 'DELETE')
      .then((resp) => {
        runInAction(() => {
          if (resp) {
            this.setClientData(resp.data.key, resp.data.data)
            this.catalog.refreshPluginList()
          }
        })
      })
  }

  /**
   * Construct setup for RISP.
   * @param baseUrl
   */
  rispSetup(baseUrl) {
    const token = net.getConf(Configuration.UI_API_URL, 'token')
    return {
      baseUrl,
      store: this,
      token,
      errorMessage: (msg) => this.addError(msg),
      successMessage: (msg) => this.addMessage(msg),
    }
  }
}

export default Store
