import { test, expect } from '@jest/globals'
import { UnitTester } from '../src/UnitTester'

test('Use partly debt to buy assets', async () => {

  const tester = new UnitTester()

  tester.addMoney('trade.currency.EUR', 10000)
  // Set up debt account.
  tester.set('account.debt.currency.EUR', '8001')

  await tester.test(
    // Buy 2.0 ETH for 200€ when we have only 100€ on the account.
    [
      {
        reason: 'trade',
        type: 'currency',
        asset: 'EUR',
        amount: -200
      },
      {
        reason: 'trade',
        type: 'crypto',
        asset: 'ETH',
        amount: 2.0
      },
    ], [[
      {
        account: 'trade.currency.EUR',
        amount: -10000,
        description: 'Buy +2 ETH',
      },
      {
        account: 'trade.crypto.ETH',
        amount: 20000,
        data: {
          stock: {
            change: {
              ETH: {
                amount: 2,
                value: 20000,
              },
            },
          },
        },
        description: 'Buy +2 ETH',
      },
      {
        account: 'debt.currency.EUR',
        amount: -10000,
        description: 'Buy +2 ETH',
      },
    ]]
  )

  expect(tester.getBalance('trade.currency.EUR')).toBe(0)
  expect(tester.getBalance('debt.currency.EUR')).toBe(-10000)
  expect(tester.getBalance('trade.crypto.ETH')).toBe(20000)
})

test('Use all debt to buy assets', async () => {

  const tester = new UnitTester()

  tester.addMoney('trade.currency.EUR', 0)
  // Set up debt account.
  tester.set('account.debt.currency.EUR', '8001')

  await tester.test(
    // Buy 2.0 ETH for 200€ when we have only 0€ on the account.
    [
      {
        reason: 'trade',
        type: 'currency',
        asset: 'EUR',
        amount: -200
      },
      {
        reason: 'trade',
        type: 'crypto',
        asset: 'ETH',
        amount: 2.0
      },
    ], [[
      {
        account: 'debt.currency.EUR',
        amount: -20000,
        description: 'Buy +2 ETH',
      },
      {
        account: 'trade.crypto.ETH',
        amount: 20000,
        data: {
          stock: {
            change: {
              ETH: {
                amount: 2,
                value: 20000,
              },
            },
          },
        },
        description: 'Buy +2 ETH',
      },
    ]]
  )

  expect(tester.getBalance('trade.currency.EUR')).toBe(0)
  expect(tester.getBalance('debt.currency.EUR')).toBe(-20000)
  expect(tester.getBalance('trade.crypto.ETH')).toBe(20000)
})

test('Pay back debt more than fully', async () => {

  const tester = new UnitTester()

  tester.set('account.debt.currency.EUR', '8001')
  tester.addMoney('debt.currency.EUR', -10000)

  await tester.test(
    // Deposit 200€ to account having -100€ debt.
    [
      {
        reason: 'deposit',
        type: 'external',
        asset: 'EUR',
        amount: -200
      },
      {
        reason: 'deposit',
        type: 'currency',
        asset: 'EUR',
        amount: 200
      }
    ], [[
      {
        account: 'deposit.external.EUR',
        amount: -20000,
        description: 'Deposit to Coinbase service',
      },
      {
        account: 'deposit.currency.EUR',
        amount: 10000,
        description: 'Deposit to Coinbase service',
      },
      {
        account: 'debt.currency.EUR',
        amount: 10000,
        description: 'Deposit to Coinbase service',
      }
    ]]
  )

  expect(tester.getBalance('deposit.external.EUR')).toBe(-20000)
  expect(tester.getBalance('deposit.currency.EUR')).toBe(10000)
  expect(tester.getBalance('debt.currency.EUR')).toBe(0)
})

test('Pay back partial debt', async () => {

  const tester = new UnitTester()

  tester.set('account.debt.currency.EUR', '8001')
  tester.addMoney('debt.currency.EUR', -30000)

  await tester.test(
    // Deposit 200€ to account having -300€ debt.
    [
      {
        reason: 'deposit',
        type: 'external',
        asset: 'EUR',
        amount: -200
      },
      {
        reason: 'deposit',
        type: 'currency',
        asset: 'EUR',
        amount: 200
      }
    ], [[
      {
        account: 'deposit.external.EUR',
        amount: -20000,
        description: 'Deposit to Coinbase service',
      },
      {
        account: 'debt.currency.EUR',
        amount: 20000,
        description: 'Deposit to Coinbase service',
      }
    ]]
  )

  expect(tester.getBalance('deposit.external.EUR')).toBe(-20000)
  expect(tester.getBalance('deposit.currency.EUR')).toBe(0)
  expect(tester.getBalance('debt.currency.EUR')).toBe(-10000)
})
