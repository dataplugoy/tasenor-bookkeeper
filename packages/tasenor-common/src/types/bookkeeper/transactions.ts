import { SegmentId } from "../../import"
import { ID } from "../../process_types"
import { AdditionalTransferInfo, Asset, AssetRates, StockValueData } from "../assets"
import { AccountNumber } from "./accounts"

/**
 * Additional optional information like stock changes or conversion rates used for a transaction line.
 */
export type TransactionLineData = {
  stock?: {
    change: Record<Asset, StockValueData>
  }
  rates?: AssetRates
}

/**
 * A single line of transaction.
 */
export type TransactionLine = {
  id?: ID
  account: AccountNumber,
  amount: number,
  description: string,
  data?: AdditionalTransferInfo
}

/**
 * If transaction is a result of an import, then this type describes if it has been created.
 *
 * Values are:
 * * `not done` - Execution is not yet performed.
 * * `created` - Entries has been created.
 * * `duplicate` - Entries has been found as duplicate.
 * * `ignored` - Entries has been ignored by some rule.
 * * `skipped` - This transaction has been explicitly skipped by user instruction.
 * * `reverted` - This transaction has been rolled back later after creation.
 */
export type ImportExecutionResult = 'not done' | 'created' | 'duplicate' | 'ignored' | 'skipped' | 'reverted'

/**
 * A transaction data.
 */
export type Transaction = {
  id?: ID
  date: Date,
  segmentId?: SegmentId
  entries: TransactionLine[]
  executionResult?: ImportExecutionResult
}

/**
 * Sort transactions so that their entries are sorted by account number and transactions by their date.
 * @param txs
 * @returns
 */
export function sortTransactions(txs: Transaction[]) {
  for (const tx of txs) {
    tx.entries = tx.entries.sort((a, b) => a.account === b.account ? 0 : (a.account < b.account ? -1 : 1))
  }
  return txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
