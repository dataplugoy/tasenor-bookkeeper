import { AccountNumber, AccountType, Tag, TagType } from '.'
import { Asset, ShortDate, StockValueData, Url } from '..'
import { ID, RealID } from '../../process_types'
import { Currency, Language } from '../common'
import { PluginCode } from '../plugins'

// These are simplified definitions of the actual Bookkeeper data.
// Only functions needed by components are declared here so far.
// This could be more comprehensive and support full Typescript conversion in future.

/**
 * An account model data in the accounting schema.
 */
export interface AccountModelData {
  id: ID
  number: AccountNumber
  name: string
  type: AccountType
  data: {
    favourite?: boolean
    code?: Asset | null
    plugin?: PluginCode
    currency?: Currency
  }
  currency: Currency | null
  language: Language | null
}

/**
 * An account model in the accounting schema.
 */
export declare class AccountModel implements AccountModelData {
  id: ID
  number: AccountNumber
  name: string
  type: AccountType
  data: {
    favourite?: boolean
    code?: Asset | null
    plugin?: PluginCode
    currency?: Currency
  }

  currency: Currency | null
  language: Language | null

  getUrl(): Url
}

/**
 * A data model for storing account balance.
 */
export interface BalanceModelData {
  account_id: ID
  number: AccountNumber | null
  debit: number | null
  credit: number | null
  total: number | null
}

/**
 * A model for storing account balance.
 */
export declare class BalanceModel implements BalanceModelData {
  account_id: ID
  number: AccountNumber | null
  debit: number | null
  credit: number | null
  total: number | null
}

/**
 * Extra data for entry model.
 */
export interface AdditionalEntryModelData {
  stock?: {
    set?: Partial<Record<Asset, StockValueData>>
    change?: Partial<Record<Asset, StockValueData>>
  },
  VAT?: {
    reconciled?: boolean
    ignore?: boolean
  }
}

/**
 * A transaction line data.
 */
export interface EntryModelData {
  id?: ID
  account_id?: ID
  number?: AccountNumber // Alternative way of describing account.
  amount: number
  debit?: 0 | 1
  description: string
  document_id?: ID
  row_number?: number | null
  tagNames?: string[]
  data?: AdditionalEntryModelData
}

/**
 * A transaction line.
 */
export declare class EntryModel implements EntryModelData {
  id?: ID
  account_id: ID
  amount: number
  debit: 0 | 1
  description: string
  document_id: ID
  row_number: number | null
  tagNames?: string[]
  data?: AdditionalEntryModelData

  save(): Promise<void>
  delete(): Promise<void>
}

/**
 * Transaction data.
 */
export interface DocumentModelData {
  id?: ID
  number?: number
  period_id: ID
  date: ShortDate
  entries?: EntryModelData[]
}

/**
 * A transaction.
 */
export declare class DocumentModel implements DocumentModelData {
  id?: ID
  number?: number
  period_id: ID
  date: ShortDate
  entries?: EntryModel[]

  save(): Promise<void>
  delete(): Promise<void>
}

/**
 * Period data.
 */
export interface PeriodModelData {
  id: ID
  start_date: ShortDate
  end_date: ShortDate
  locked: boolean
  balances?: BalanceModelData[]
}

/**
 * A period.
 */
export declare class PeriodModel implements PeriodModelData {
  id: ID
  start_date: ShortDate
  end_date: ShortDate
  locked: boolean

  save(): Promise<void>
  delete(): Promise<void>
  getDocument(id: ID): DocumentModel
  createDocument(data: DocumentModelData): Promise<void>
  getBalanceByNumber(number: AccountNumber): BalanceModel
}

/**
 * A heading definition for account listing.
 */
export interface HeadingModelData {
  id: ID
  number: AccountNumber
  level: number
  text: string
}

/**
 * A heading definition for account listing.
 */
export declare class HeadingModel implements HeadingModelData {
  id: ID
  number: AccountNumber
  level: number
  text: string
}

/**
 * A tag data.
 */
export interface TagModelData {
  id?: ID
  tag: null | Tag
  name: string
  picture: null | string
  mime: null | string
  type: null | TagType
  order: number
  url: null | Url
}

/**
 * A tag.
 */
export declare class TagModel implements TagModelData {
  id?: ID
  tag: null | Tag
  name: string
  picture: null | string
  mime: null | string
  type: null | TagType
  order: number
  url: null | Url

  constructor(parent: DatabaseModel, init: Partial<TagModelData>)
  save(): Promise<void>
  delete(): Promise<void>
  delete(): Promise<void>
}

/**
 * A data for database model.
 */
export interface DatabaseModelData {
  name: null | string
  periodsById: Record<RealID, PeriodModel>
  accountsById: Record<RealID, AccountModel>
  accountsByNumber: Record<AccountNumber, AccountModel>
  tagsByTag: Record<Tag, TagModel>
  headingsByNumber: Record<number, HeadingModel>
}

/**
 * A model for database.
 */
export declare class DatabaseModel implements DatabaseModelData {
  name: null | string
  periodsById: Record<RealID, PeriodModel>
  accountsById: Record<RealID, AccountModel>
  accountsByNumber: Record<AccountNumber, AccountModel>
  tagsByTag: Record<Tag, TagModel>
  headingsByNumber: Record<number, HeadingModel>

  getAccountByNumber(number: string): AccountModel
  getTag(tag: Tag): TagModel
  addTag(tag: Partial<TagModel>): Promise<TagModel>
}

/**
 * An importer definition data.
 */
export interface ImporterModelData {

  id?: ID
  name: string
  config: Record<string, unknown>
}

/**
 * An importer definition.
 */
export declare class ImporterModel implements ImporterModelData {
  id?: ID
  name: string
  config: Record<string, unknown>
}
