import { Bookkeeper } from '../src'

test('Configuration creation', async () => {
  const conf = Bookkeeper.createConfig()
  expect(conf.companyName).toBe(null)
  expect(conf.companyCode).toBe(null)
  expect(conf.language).toBe(null)
  expect(conf.currency).toBe(null)
})
