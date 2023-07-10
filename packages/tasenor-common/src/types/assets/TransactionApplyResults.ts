import { AccountNumber, Transaction } from "../bookkeeper"

/**
 * A resulting data from imported transaction execution.
 */
export class TransactionApplyResults {
  created: number
  duplicates: number
  ignored: number
  skipped: number
  accounts: Record<AccountNumber, number>

  constructor() {
    this.created = 0
    this.duplicates = 0
    this.ignored = 0
    this.skipped = 0
    this.accounts = {}
  }

  /**
   * Add transaction as created.
   * @param tx
   */
  create(tx: Transaction) {
    this.created++
    this.record(tx)
  }

  /**
   * Add transaction as created.
   * @param tx
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ignore(tx: Transaction) {
    this.ignored++
  }

  /**
   * Add transaction as duplicate.
   * @param tx
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  duplicate(tx: Transaction) {
    this.duplicates++
  }

  /**
   * Add transaction as skipped.
   * @param tx
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  skip(tx: Transaction) {
    this.skipped++
  }

  /**
   * Record changes from the transaction.
   * @param tx
   */
  record(tx: Transaction) {
    for (const entry of tx.entries) {
      const { account, amount } = entry
      this.accounts[account] = (this.accounts[account] || 0) + amount
    }
  }

  /**
   * Combine results from the other result set.
   * @param result
   */
  add(result: Record<string, unknown>) {
    if ('created' in result) {
      this.created += parseInt(result.created as string || '0')
    }
    if ('duplicates' in result) {
      this.duplicates += parseInt(result.duplicates as string || '0')
    }
    if ('ignored' in result) {
      this.ignored += parseInt(result.ignored as string || '0')
    }
    if ('skipped' in result) {
      this.skipped += parseInt(result.skipped as string || '0')
    }
    if ('accounts' in result) {
      const accounts: Record<string, number> = result.accounts as Record<string, number>
      Object.keys(accounts).forEach(account => {
        this.accounts[account] = (this.accounts[account] || 0) + accounts[account]
      })
    }
  }

  /**
   * Collect JSON data of the recordings.
   * @returns
   */
  toJSON(): Record<string, number | Record<string, number>> {
    return {
      created: this.created,
      ignored: this.ignored,
      duplicates: this.duplicates,
      skipped: this.skipped,
      accounts: this.accounts
    }
  }
}
