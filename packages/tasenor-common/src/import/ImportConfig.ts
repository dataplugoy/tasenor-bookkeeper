import { ImportRule } from '../language'
import { AssetTransfer, AccountAddress, AccountNumber, Tag, Language, Currency, ShortDate, AssetType, Asset } from '../types'
import { SegmentId } from './TextFileLine'

/**
 * A collection of answers for a given import segment.
 */
export type Answers = Partial<
  {
    transfers: AssetTransfer[]
  }
&
  Record<string, string | number>
>

/**
 * An event describing an asset that has been renamed at the given date.
 */
export type GlobalAssetRenaming = {
  date: ShortDate
  type: AssetType,
  old: Asset,
  new: Asset
}

/**
 * Segment independent answers for the import process.
 */
export type GlobalAnswers = Partial<{
  'asset-renaming': GlobalAssetRenaming[]
}>

/**
 * All answers combined.
 */
export type ImportAnswers = Partial<Record<SegmentId, Answers> & Record<'', GlobalAnswers>>

// TODO: Work in progress. Lot of stuff missing...
/**
 * Import process configuration.
 */
export type ImportConfig = Partial<
  {
    'tags.*.*.*': Tag[],
    allowShortSelling: boolean
    answers: ImportAnswers
    badTransactionDates: 'ignore' | 'error'
    cashAccount: AccountNumber
    currency: Currency,
    isCryptoTradeFeePartOfTotal: boolean
    isForexFeePartOfTotal: boolean
    isTradeFeePartOfTotal: boolean
    isWithdrawalFeePartOfTotal: boolean
    language: Language,
    recordDeposits: boolean
    recordWithdrawals: boolean
    rules: ImportRule[]
  }
&
  Record<AccountAddress, AccountNumber>
>
