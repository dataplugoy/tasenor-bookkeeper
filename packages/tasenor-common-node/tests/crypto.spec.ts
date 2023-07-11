import { Password } from '../src'

test('Password', async () => {
  const saved = await Password.hash('Hello!')
  expect(await Password.compare('Hello!', saved)).toBe(true)
  expect(await Password.compare('Hello?', saved)).toBe(false)
})
