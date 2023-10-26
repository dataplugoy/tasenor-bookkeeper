import { test, expect } from '@jest/globals'
import { UnitTester } from '../src/UnitTester'

test('Buying and selling', async () => {

  const tester = new UnitTester()

  tester.addMoney('trade.currency.EUR', 1000000)

  await tester.test(
    // Buy 1.5 ETH for 200€ and 1€ fee.
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
        amount: 1.5
      },
      {
        reason: 'fee',
        type: 'currency',
        asset: 'EUR',
        amount: 1
      }
    ], [[
      {
        account: 'trade.currency.EUR',
        amount: -20100,
        description: 'Buy +1.5 ETH',
      },
      {
        account: 'trade.crypto.ETH',
        amount: 20000,
        data: {
          stock: {
            change: {
              ETH: {
                amount: 1.5,
                value: 20000,
              },
            },
          },
        },
        description: 'Buy +1.5 ETH',
      },
      {
        account: 'fee.currency.EUR',
        amount: 100,
        description: 'Buy +1.5 ETH',
      }
    ]],
    // Sell 1.5 ETH for 250€ and 1€ fee.
    [
      {
        reason: 'trade',
        type: 'currency',
        asset: 'EUR',
        amount: 251
      },
      {
        reason: 'trade',
        type: 'crypto',
        asset: 'ETH',
        amount: -1.5
      },
      {
        reason: 'fee',
        type: 'currency',
        asset: 'EUR',
        amount: 1
      }
    ], [[
      {
        account: 'trade.currency.EUR',
        amount: 25000,
        description: 'Sell -1.5 ETH',
      },
      {
        account: 'trade.crypto.ETH',
        amount: -20000,
        data: {
          stock: {
            change: {
              ETH: {
                amount: -1.5,
                value: -20000,
              },
            },
          },
        },
        description: 'Sell -1.5 ETH',
      },
      {
        account: 'fee.currency.EUR',
        amount: 100,
        description: 'Sell -1.5 ETH',
      },
      {
        account: 'income.statement.TRADE_PROFIT_CRYPTO',
        amount: -5100,
        description: 'Sell -1.5 ETH',
      }
    ]],
    // Buy 5 NAKD for 300€, no fee.
    [
      {
        reason: 'trade',
        type: 'currency',
        asset: 'EUR',
        amount: -300
      },
      {
        reason: 'trade',
        type: 'stock',
        asset: 'NAKD',
        amount: 5
      }
    ], [[
      {
        account: 'trade.currency.EUR',
        amount: -30000,
        description: 'Buy +5 NAKD',
      },
      {
        account: 'trade.stock.NAKD',
        amount: 30000,
        data: {
          stock: {
            change: {
              NAKD: {
                amount: 5,
                value: 30000,
              },
            },
          },
        },
        description: 'Buy +5 NAKD',
      },
    ]],
    // Sell 5 NAKD for 200€, no fee.
    [
      {
        reason: 'trade',
        type: 'currency',
        asset: 'EUR',
        amount: 200
      },
      {
        reason: 'trade',
        type: 'stock',
        asset: 'NAKD',
        amount: -5
      }
    ], [[
      {
        account: 'trade.currency.EUR',
        amount: 20000,
        description: 'Sell -5 NAKD',
      },
      {
        account: 'trade.stock.NAKD',
        amount: -30000,
        data: {
          stock: {
            change: {
              NAKD: {
                amount: -5,
                value: -30000,
              },
            },
          },
        },
        description: 'Sell -5 NAKD',
      },
      {
        account: 'expense.statement.TRADE_LOSS_STOCK',
        amount: 10000,
        description: 'Sell -5 NAKD',
      },
    ]]
  )

  expect(tester.getBalance('trade.currency.EUR', new Date('2023-01-01T00:00:00.000Z').getTime())).toBe(994900)
  expect(tester.getBalance('trade.stock.NAKD', new Date('2023-01-01T00:00:00.000Z').getTime())).toBe(0)
  expect(tester.getBalance('expense.statement.TRADE_LOSS_STOCK', new Date('2023-01-01T00:00:00.000Z').getTime())).toBe(10000)
  expect(tester.getBalance('trade.crypto.ETH', new Date('2023-01-01T00:00:00.000Z').getTime())).toBe(0)
  expect(tester.getBalance('fee.currency.EUR', new Date('2023-01-01T00:00:00.000Z').getTime())).toBe(200)
  expect(tester.getBalance('income.statement.TRADE_PROFIT_CRYPTO', new Date('2023-01-01T00:00:00.000Z').getTime())).toBe(-5100)
})

test('Short selling', async () => {

  const tester = new UnitTester()

  tester.set('allowShortSelling', true)
  tester.answer('segment0', 'hasBeenRenamed.stock.NAKD', false)

  await tester.test(
    // Short sell 100 NAKD for $1000 with $5 fee.
    [
      {
        reason: 'trade',
        type: 'currency',
        asset: 'USD',
        amount: 1000
      },
      {
        reason: 'trade',
        type: 'stock',
        asset: 'NAKD',
        amount: -100
      },
      {
        reason: 'fee',
        type: 'currency',
        asset: 'USD',
        amount: 5
      }
    ],
    [[
      {
        account: 'trade.currency.USD',
        amount: 99500,
        data: {
          currency: 'USD',
          currencyValue: 99500,
          rates: {
            USD: 1,
          },
        },
        description: 'Short selling -100 NAKD',
      },
      {
        account: 'trade.short.NAKD',
        amount: -100000,
        data: {
          currency: 'USD',
          currencyValue: -100000,
          rates: {
            USD: 1,
          },
          stock: {
            change: {
              NAKD: {
                amount: -100,
                value: -100000,
              },
            },
          },
        },
        description: 'Short selling -100 NAKD',
      },
      {
        account: 'fee.currency.USD',
        amount: 500,
        data: {
          currency: 'USD',
          currencyValue: 500,
          rates: {
            USD: 1,
          },
        },
        description: 'Short selling -100 NAKD',
      },
    ]], [
    // Buy 100 NAKD back for $900 and $5 fee.
      {
        reason: 'trade',
        type: 'currency',
        asset: 'USD',
        amount: -900
      },
      {
        reason: 'trade',
        type: 'stock',
        asset: 'NAKD',
        amount: 100
      },
      {
        reason: 'fee',
        type: 'currency',
        asset: 'USD',
        amount: 5
      }
    ], [[
      {
        account: 'trade.currency.USD',
        amount: -90500,
        data: {
          currency: 'USD',
          currencyValue: -90500,
          rates: {
            USD: 1,
          },
        },
        description: 'Closing short position +100 NAKD',
      },
      {
        account: 'trade.short.NAKD',
        amount: 100000,
        data: {
          currency: 'USD',
          currencyValue: 100000,
          rates: {
            USD: 1,
          },
          stock: {
            change: {
              NAKD: {
                amount: 100,
                value: 100000,
              },
            },
          },
        },
        description: 'Closing short position +100 NAKD',
      },
      {
        account: 'fee.currency.USD',
        amount: 500,
        data: {
          currency: 'USD',
          currencyValue: 500,
          rates: {
            USD: 1,
          },
        },
        description: 'Closing short position +100 NAKD',
      },
      {
        account: 'income.statement.TRADE_PROFIT_SHORT',
        amount: -10000,
        data: {
          currency: 'USD',
          currencyValue: -10000,
          rates: {
            USD: 1,
          },
        },
        description: 'Closing short position +100 NAKD',
      },
    ]],
  )

  expect(tester.getBalance('trade.currency.USD', new Date('2023-01-01T00:00:00.000Z').getTime())).toBe(9000)
  expect(tester.getBalance('fee.currency.USD', new Date('2023-01-01T00:00:00.000Z').getTime())).toBe(1000)
  expect(tester.getBalance('income.statement.TRADE_PROFIT_SHORT', new Date('2023-01-01T00:00:00.000Z').getTime())).toBe(-10000)
  expect(tester.getBalance('trade.short.NAKD', new Date('2023-01-01T00:00:00.000Z').getTime())).toBe(0)
})
