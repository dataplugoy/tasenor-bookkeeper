import { expect, test } from '@jest/globals'
import { Crypto } from '../src'

test('Crypto', async () => {
  const key = await Crypto.generateKey()
  expect(typeof key === 'string')
  expect(key.length > 16)

  const q = await Crypto.encrypt(key, 'Hello!')
  expect(q).toBeTruthy()

  const s = await Crypto.decrypt(key, q)
  expect(s === 'Hello!')
})
