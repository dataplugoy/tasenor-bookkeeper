import { StockBookkeeping, CryptoCurrency, StockTicker } from '../src'

test('StockBookkeeping basics', async () => {
  const stock = new StockBookkeeping()
  const ETH: CryptoCurrency = 'ETH' as CryptoCurrency

  expect(stock.get(new Date('2000-01-01T00:00:00.000Z'), 'crypto', ETH)).toStrictEqual({
    time: new Date('2000-01-01T00:00:00.000Z'),
    amount: 0.0,
    value: 0.0
  })

  stock.change(new Date('2000-01-01T22:00:00.000Z'), 'crypto', ETH, +1.0, 100.0)
  expect(() => stock.change(new Date('1999-12-31T20:00:00.000Z'), 'crypto', ETH, +1.0, 100.0)).toThrow()

  stock.change(new Date('2000-01-01T22:00:10.000Z'), 'crypto', ETH, +1.0, 100.0)

  expect(stock.get(new Date('2000-01-01T00:00:00.000Z'), 'crypto', ETH)).toStrictEqual({
    time: new Date('2000-01-01T00:00:00.000Z'),
    amount: 0.0,
    value: 0.0
  })
  expect(stock.get(new Date('2000-01-01T22:00:00.000Z'), 'crypto', ETH)).toStrictEqual({
    time: new Date('2000-01-01T22:00:00.000Z'),
    amount: 1.0,
    value: 100.0
  })
  expect(stock.get(new Date('2000-01-01T22:00:10.000Z'), 'crypto', ETH)).toStrictEqual({
    time: new Date('2000-01-01T22:00:10.000Z'),
    amount: 2.0,
    value: 200.0
  })
  expect(stock.get(new Date('2000-01-01T22:30:00.000Z'), 'crypto', ETH)).toStrictEqual({
    time: new Date('2000-01-01T22:00:10.000Z'),
    amount: 2.0,
    value: 200.0
  })

  stock.change(new Date('2000-01-01T22:00:10.000Z'), 'crypto', ETH, -0.5, -100.0)
  expect(stock.get(new Date('2000-01-01T22:30:00.000Z'), 'crypto', ETH)).toStrictEqual({
    time: new Date('2000-01-01T22:00:10.000Z'),
    amount: 1.5,
    value: 100.0
  })

  stock.apply(new Date('2000-02-02T00:00:00.000Z'), {
    stock: {
      change: {
        [ETH]: {
          amount: -1.0,
          value: -50
        }
      }
    }
  })
  expect(stock.get(new Date('2000-02-02T00:00:00.000Z'), 'crypto', ETH)).toStrictEqual({
    time: new Date('2000-02-02T00:00:00.000Z'),
    amount: 0.5,
    value: 50.0
  })

  expect(stock.totals()).toStrictEqual([ [ 'crypto', ETH, 0.5 ] ])
  expect(stock.total(ETH)).toBe(0.5)
  expect(stock.total('crypto', ETH)).toBe(0.5)
  expect(stock.total('other', ETH)).toBe(0)

})

test('StockBookkeeping applying stock data', async () => {
  const stock = new StockBookkeeping()

  stock.apply(new Date(), {
    stock: {
      change: {
        ['NAKD' as StockTicker]: {
          amount: 5,
          value: 5
        }
      }
    }
  })

  stock.apply(new Date(), {
    stock: {
      change: {
        ['NAKD' as StockTicker]: {
          amount: 5,
          value: 5
        }
      }
    }
  })

  stock.apply(new Date(), {
    stock: {
      set: {
        ['GME' as StockTicker]: {
          amount: 5,
          value: 5
        }
      }
    }
  })

  expect(stock.total('NAKD' as StockTicker)).toBe(10)
  expect(stock.total('GME' as StockTicker)).toBe(5)
  expect(stock.toJSON()).toStrictEqual({
    GME: 5,
    NAKD: 10
  })
})
