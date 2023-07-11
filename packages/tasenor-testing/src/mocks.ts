/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import { TasenorSetup, AccountModel, AccountNumber, AccountType, BalanceModel, Currency, Cursor, DatabaseModel, EntryModel, HeadingModel, ID, RealID, Language, PeriodModel, Tag, TagModel, TagType, Url, VATTarget, Asset, TasenorPlugin, BackendPlugin, Store } from '@dataplug/tasenor-common'
import { sprintf } from 'sprintf-js'
import dayjs from 'dayjs'

const randomID = () => Math.round(Math.random() * 999999)

/**
 * Mock for tags.
 */
let nextOrder = 1
export class MockTagModel {
  id?: ID
  tag: null | Tag
  name: string
  picture: null | ArrayBuffer
  type: TagType
  order: number

  constructor(parent, params: { tag: Tag, name: string, type: TagType, order: undefined | number }) {
    this.id = randomID()
    this.tag = params.tag as Tag
    this.name = params.name
    this.type = params.type
    this.picture = null
    this.order = params.order ? params.order : nextOrder++
  }

  get url(): Url {
    const PICS = {
      UNKNOWN: 'q.png',
      Nordnet: 'nordnet.jpeg'
    }
    return `/${this.tag && PICS[this.tag] ? PICS[this.tag] : PICS.UNKNOWN}` as Url
  }

  async save(): Promise<void> {}
  async delete(): Promise<void> {}
}

/**
 * Mock for accounts.
 */
export class MockAccountModel {
  id: ID
  number: AccountNumber
  name: string
  type: AccountType
  data: {
    favourite: boolean
    code: Asset | null
  }

  currency: Currency | null
  language: Language | null

  constructor(parent, params: { number: string, name: string, type: AccountType }) {
    this.id = randomID()
    this.number = params.number as AccountNumber
    this.name = params.name
    this.type = params.type
    this.data = {
      favourite: false,
      code: null
    }
    this.currency = 'EUR'
    this.language = 'fi'
  }

  getUrl(): Url {
    return '' as Url
  }
}

/**
 * Mock for databases.
 */
export class MockDatabaseModel {
  name: null | string
  periodsById: Record<RealID, PeriodModel>
  accountsById: Record<RealID, AccountModel>
  accountsByNumber: Record<number, AccountModel>
  tagsByTag: Record<Tag, TagModel>
  headingsByNumber: Record<number, HeadingModel>

  constructor(parent, params: { name: string }) {
    this.name = params.name
    this.periodsById = {}
    this.headingsByNumber = {}

    this.accountsById = {}
    this.accountsByNumber = {}
    const ACCOUNTS = [
      { number: '1000', name: 'Bank 1', type: AccountType.ASSET },
      { number: '1001', name: 'Bank 2', type: AccountType.ASSET }
    ]
    ACCOUNTS.forEach(account => {
      const { number, name, type } = account
      const model = new MockAccountModel(null, { number, name, type })
      model.id = randomID()
      this.accountsByNumber[model.number] = model
      this.accountsById[model.id] = model
    })

    const TAGS = [
      { id: 25, tag: 'Nordnet', name: 'Nordnet', mime: 'image/jpeg', type: 'Operator', order: 3005 }
    ]

    this.tagsByTag = {}
    TAGS.forEach(({ tag, name, type, order }) => {
      this.tagsByTag[tag] = new MockTagModel(null, { tag: tag as Tag, name, type: type as TagType, order })
    })
  }

  getAccountByNumber(number: string): AccountModel {
    return this.accountsByNumber[number]
  }

  getTag(tag: Tag): TagModel {
    return this.tagsByTag[tag]
  }

  async addTag(tag: Partial<TagModel>): Promise<TagModel> {
    throw new Error('Not implemented.')
  }
}

export class MockCatalog {

  history: unknown

  getCurrencies(): Currency[] {
    return ['EUR', 'USD', 'SEK', 'DKK']
  }

  language(): Language {
    return 'en'
  }

  money2str(cents: number, currency?: Currency, signed?: boolean): string {
    const sign = signed ? (cents < 0 ? '' : '+') : ''
    return sign + sprintf('%.2f', cents / 100)
  }

  date2str(date: string | number): string {
    return dayjs(date).format('YYYY-MM-DD')
  }

  t(str: string): string {
    return str
  }

  getImportOptions(): Record<string, TasenorPlugin> {
    return {}
  }

  reset(): void {}

  load(plugin): BackendPlugin {
    return plugin
  }

  async reload(): Promise<void> {
  }
}

/**
 * Mock for mobx store.
 */
export class MockStore {
  db: string
  database: DatabaseModel
  dbsByName: Record<string, DatabaseModel>
  catalog: MockCatalog
  periodId: number | null
  period?: PeriodModel

  constructor() {
    this.db = 'mock'
    this.database = new MockDatabaseModel(null, { name: 'mock' })
    this.dbsByName = { mock: this.database }
    this.catalog = new MockCatalog()
  }

  async updateSettings(db: string | null, values: Record<string, unknown>): Promise<void> {
    console.log('Update settings', db, values)
  }

  addError(text:string): void {
    console.error(text)
  }

  addMessage(text:string): void {
    console.log(text)
  }

  get accounts(): AccountModel[] {
    return Object.values(this.database.accountsById)
  }

  async fetchDocuments(db?: string, periodId?: number): Promise<void> {
  }

  async deleteDocument(doc): Promise<BalanceModel[]> {
    return []
  }

  getDocuments(accounts?: AccountNumber[], filter?: (e: EntryModel) => boolean) {
  }

  async fetchBalances(db?: string, periodId?: number): Promise<void> {
  }

  async request(path, method = 'GET', data = null, file = null, noDimming = false) {
  }

  rispSetup(baseUrl: string): TasenorSetup {
    return setup
  }
}

export class MockCursor {
  disableHandler(): void {}
  enableHandler(): void {}
  handle(key: string): void {}
  addModal(name: string, hooks: Record<string, (cursor: Cursor, key: string) => void>) {}
  removeModal(name: string) {}
}

export class MockSettings {
  get(name: string): unknown {
    return null
  }
}

export const setup: TasenorSetup = {
  store: new MockStore() as unknown as Store, // TODO: Need more functions to Catalog in order to satisfy Store.
  baseUrl: '',
  token: '',
  errorMessage: () => console.log('ERROR'),
  successMessage: () => console.log('OK')
}
