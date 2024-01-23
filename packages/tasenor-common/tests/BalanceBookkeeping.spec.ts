import { expect, test } from '@jest/globals'
import { AccountAddress, AccountNumber, BalanceBookkeeping, Timestamp, TransactionLine, mute } from '../src'

test('Balance bookkeeping real time', async () => {

  const balance = new BalanceBookkeeping()

  balance.configureNames({
    'account.income.random': '1'
  })

  const tx: TransactionLine = {
    account: '1' as AccountNumber,
    amount: 12,
    description: ''
  }

  balance.apply(tx)
  expect(balance.get('income.random' as AccountAddress)).toBe(12)
  balance.apply(tx)
  expect(balance.get('income.random' as AccountAddress)).toBe(24)
  balance.revert(tx)
  expect(balance.get('income.random' as AccountAddress)).toBe(12)
  balance.revert(tx)
  expect(balance.get('income.random' as AccountAddress)).toBe(0)
})

test('Balance bookkeeping history', async () => {

  const balance = new BalanceBookkeeping()

  balance.configureNames({
    'account.income.random': '1'
  })

  const tx1: TransactionLine = {
    account: '1' as AccountNumber,
    amount: 12,
    description: ''
  }
  balance.apply(tx1, 1000 as Timestamp)

  const tx2: TransactionLine = {
    account: '1' as AccountNumber,
    amount: -11,
    description: ''
  }
  balance.apply(tx2, 3000 as Timestamp)

  const tx3: TransactionLine = {
    account: '1' as AccountNumber,
    amount: 3,
    description: ''
  }
  balance.apply(tx3, 2000 as Timestamp)
  balance.apply(tx3, 2000 as Timestamp)

  /* Balance history is now
     [
      { time: 1000, change: 12 },
      { time: 2000, change: 3 },
      { time: 2000, change: 3 },
      { time: 3000, change: -11 }
     ]
  */

  expect(balance.get('income.random' as AccountAddress, 500 as Timestamp)).toBe(0)
  expect(balance.get('income.random' as AccountAddress, 1000 as Timestamp)).toBe(12)
  expect(balance.get('income.random' as AccountAddress, 1500 as Timestamp)).toBe(12)
  expect(balance.get('income.random' as AccountAddress, 2000 as Timestamp)).toBe(18)
  expect(balance.get('income.random' as AccountAddress, 2500 as Timestamp)).toBe(18)
  expect(balance.get('income.random' as AccountAddress, 3000 as Timestamp)).toBe(7)
  expect(balance.get('income.random' as AccountAddress, 3500 as Timestamp)).toBe(7)
  expect(balance.get('income.random' as AccountAddress)).toBe(7)
  mute()
  expect(balance.get('1' as AccountAddress)).toBe(7)
})
