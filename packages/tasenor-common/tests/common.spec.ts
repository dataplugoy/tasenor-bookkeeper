import { expect, test } from '@jest/globals'
import { isAccountAddress, isReportItem, isValues } from '../src'

test('atom values', () => {
  expect(isValues({ a: 12, b: true })).toBe(true)
  expect(isValues([])).toBe(true)
  expect(isValues([false])).toBe(true)
  expect(isValues({ a: () => null })).toBe(false)
  expect(isValues([() => null])).toBe(false)
})

test('Account address validation', () => {
  expect(isAccountAddress('deposit.currency.EUR')).toBe(true)
  expect(isAccountAddress('trade.crypto.BTC')).toBe(true)
  expect(isAccountAddress('expense.statement.OTHER_EXPENSES')).toBe(true)
  expect(isAccountAddress('expense.account.4000')).toBe(true)
  expect(isAccountAddress('fee.currency.*')).toBe(true)
  expect(isAccountAddress('deposit.currency')).toBe(false)
  expect(isAccountAddress('deposit.currency.EUR.X')).toBe(false)
  expect(isAccountAddress('nonsense.currency.EUR')).toBe(false)
  expect(isAccountAddress('deposit.nonsense.EUR')).toBe(false)
})

test('Report item recognition', () => {
  expect(isReportItem({ name: 'Total' })).toBe(true)
  expect(isReportItem({ pageBreak: true })).toBe(false)
  expect(isReportItem({ paragraphBreak: true })).toBe(false)
  expect(isReportItem(null)).toBe(false)
  expect(isReportItem('text')).toBe(false)
})
