import { Crypto, Secret } from '../src'

test('Crypto', async () => {
  const c = new Crypto('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Secret)
  const q = c.encrypt('Hello!')
  expect(q).toBeTruthy()
  expect(c.decrypt(q)).toBe('Hello!')
  expect(() => new Crypto('short' as Secret)).toThrow()
})
