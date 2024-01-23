import { debug, warning } from '../logging'
import { AccountAddress, AccountNumber, Asset, AssetTransferReason, AssetType, Timestamp, TransactionLine } from '../types'
import { sprintf } from 'sprintf-js'
import { ProcessConfig } from '../process_types'

/**
 * An object describing the account and its balance.
 */
export type BalanceSummaryEntry = {
  account: AccountNumber,
  address: AccountAddress,
  debtAddress: AccountAddress,
  balance: number,
  mayTakeLoan: boolean
}

const _debug = (account: AccountNumber, ...args) => {
  if (!process.env.DEBUG_BALANCE_ACCOUNT || process.env.DEBUG_BALANCE_ACCOUNT === account) {
    debug('BALANCE', ...args)
  }
}

/**
 * A class for storing account balance.
 */
export class BalanceBookkeeping {

  private balance: Record<AccountNumber, number>
  private history: Record<AccountNumber, { time: number, change: number }[]>
  private number: Record<AccountAddress, AccountNumber>
  private warnings: Set<string>

  constructor() {
    this.balance = {}
    this.history = {}
    this.number = {}
    this.warnings = new Set()
    debug('BALANCE', 'Created new balance bookkeeper.')
  }

  /**
   * Apply initial balances.
   * @param balances
   */
  set(account: AccountNumber, value: number) {
    this.balance[account] = value
    this.history[account] = [{ time: 0, change: value }]
    _debug(account, `Set ${account} ${this.name(account)} initial balance to ${sprintf('%.2f', this.balance[account] / 100)}`)
  }

  /**
   * Set up name and number mapping from process config.
   */
  configureNames(config: ProcessConfig) {
    Object.keys(config).forEach(key => {
      if (key.startsWith('account.')) {
        this.number[key.substring(8)] = config[key]
      }
    })
  }

  /**
   * Get the real or temporary name for an account.
   * @param account
   */
  name(account: AccountNumber): string {
    return this.number[account] || `unknown.account.${account}`
  }

  /**
   * Change the account balance and return new total.
   */
  change(account: AccountNumber, change: number, time: Timestamp | undefined = undefined): number {

    if (time === undefined) {
      time = new Date().getTime() as Timestamp
    }
    if (!this.history[account] || this.history[account].length === 0) {
      this.history[account] = [{ time, change }]
    } else {
      let i = this.history[account].length
      while (i > 0 && this.history[account][i - 1].time > time) {
        i--
      }
      this.history[account] = this.history[account].slice(0, i).concat([{ time, change }]).concat(this.history[account].slice(i))
    }

    this.balance[account] = (this.balance[account] || 0) + change

    _debug(account, `${new Date(time).toISOString()}: Change ${account} ${this.name(account)} Δ ${change >= 0 ? '+' : ''}${sprintf('%.2f', change / 100)} ⟹ ${sprintf('%.2f', this.balance[account] / 100)}`)

    return this.balance[account]
  }

  /**
   * Apply transaction resulting from transfer.
   * @param txEntry
   * @returns
   */
  apply(txEntry: TransactionLine, time: Timestamp | undefined = undefined): number {
    return this.change(txEntry.account, txEntry.amount, time)
  }

  /**
   * Revert transaction resulting from transfer.
   * @param txEntry
   * @returns
   */
  revert(txEntry: TransactionLine, time: Timestamp | undefined = undefined): number {
    return this.change(txEntry.account, -txEntry.amount, time)
  }

  /**
   * Find the balance for the given account.
   */
  get(account: AccountAddress, time: Timestamp | undefined = undefined): number {
    let num = this.number[account]
    if (!(account in this.number)) {
      const text = `Cannot find account ${account} from balance bookkeeping.`
      if (!this.warnings.has(text)) {
        this.warnings.add(text)
        warning(text)
      }
      num = `${account}` as AccountNumber
    }
    return this.getByAccountNumber(num, time)
  }

  getByAccountNumber(num: AccountNumber, time: Timestamp | undefined = undefined): number {
    if (time === undefined) {
      return this.balance[num] || 0
    }

    let i = this.history[num].length - 1
    while (i >= 0 && this.history[num][i].time > time) {
      i--
    }
    let sum = 0
    while (i >= 0) {
      sum += this.history[num][i].change
      i--
    }
    return sum
  }

  /**
   * Get all records.
   */
  summary() {
    const summary: BalanceSummaryEntry[] = []
    Object.keys(this.number).forEach((addr: AccountAddress) => {
      const [reason, type, asset] = addr.split('.')

      summary.push({
        account: this.number[addr],
        address: addr,
        debtAddress: this.debtAddress(addr),
        balance: this.balance[this.number[addr]],
        mayTakeLoan: this.mayTakeLoan(reason as AssetTransferReason, type as AssetType, asset as Asset)
      })

    })
    return summary
  }

  /**
   * Check if the account could record debts separately.
   * @param reason
   * @param type
   * @param asset
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mayTakeLoan(reason: AssetTransferReason, type: AssetType, asset: Asset): boolean {
    return reason !== 'fee' && type === 'currency'
  }

  /**
   * Convert account address to corresponding debt address.
   * @param addr
   */
  debtAddress(addr: AccountAddress): AccountAddress {
    const [, type, asset] = addr.split('.')
    return `debt.${type}.${asset}` as AccountAddress
  }
}
