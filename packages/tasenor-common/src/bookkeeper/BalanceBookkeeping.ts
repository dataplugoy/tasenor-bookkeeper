import { debug } from '../logging'
import { AccountAddress, AccountNumber, Asset, AssetTransferReason, AssetType, TransactionLine } from '../types'
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

/**
 * A class for storing account balance.
 */
export class BalanceBookkeeping {

  private balance: Record<AccountNumber, number>
  private number: Record<AccountAddress, AccountNumber>

  constructor() {
    this.balance = {}
    this.number = {}
    debug('BALANCE', `Created new balance bookkeeper.`)
  }

  /**
   * Apply initial balances.
   * @param balances
   */
  set(account: AccountNumber, value: number) {
    this.balance[account] = value
    debug('BALANCE', `Set ${account} ${this.name(account)} initial balance ${sprintf('%.2f', this.balance[account] / 100)}`)
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
  change(account: AccountNumber, change: number): number {
    this.balance[account] = (this.balance[account] || 0) + change
    debug('BALANCE', `Change ${account} ${this.name(account)} Δ ${change >= 0 ? '+' : ''}${sprintf('%.2f', change / 100)} ⟹ ${sprintf('%.2f', this.balance[account] / 100)}`)
    return this.balance[account]
  }

  /**
   * Apply transaction resulting from transfer.
   * @param txEntry
   * @returns
   */
  apply(txEntry: TransactionLine): number {
    return this.change(txEntry.account, txEntry.amount)
  }

  /**
   * Revert transaction resulting from transfer.
   * @param txEntry
   * @returns
   */
  revert(txEntry: TransactionLine): number {
    return this.change(txEntry.account, -txEntry.amount)
  }

  /**
   * Find the balance for the given account.
   */
  get(account: AccountAddress): number {
    return this.balance[this.number[account]] || 0
  }

  /**
   * Get all records.
   */
  summary() {
    const summary: BalanceSummaryEntry[] = []
    Object.keys(this.number).forEach((addr: AccountAddress) => {
      const [ reason, type, asset] = addr.split('.')

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
    const [ , type, asset] = addr.split('.')
    return `debt.${type}.${asset}` as AccountAddress
  }
}
