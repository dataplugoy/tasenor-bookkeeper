import Opaque from 'ts-opaque'
import { Asset, PluginCode } from '..'

/**
 * A type of an account.
 */
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  PROFIT_PREV = 'PROFIT_PREV',
  PROFIT = 'PROFIT'
}

/**
 * A string presenting account number.
 */
export type AccountNumber = Opaque<string, 'AccountNumber'>
export function isAccountNumber(s: unknown): s is AccountNumber {
  return typeof s === 'string' && /^\d+$/.test(s)
}

/**
 * Meta data for an account.
 */
export interface AccountData {
  code: Asset
  plugin: PluginCode
}
