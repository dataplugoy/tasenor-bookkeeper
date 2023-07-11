import { vault } from '../src'

test('Test simple environment vault', async () => {
  process.env.VAULT_URL = ''
  await expect(async () => await vault.initialize()).rejects.toThrow()
  await expect(async () => await vault.get('SECRET')).rejects.toThrow()
  process.env.VAULT_URL = 'env://foo'
  expect(vault.getVault().url).toBe('env://foo')
  process.env.VAULT_URL = 'env://bar'
  expect(vault.getVault().url).toBe('env://bar')
  expect(vault.getVault().url).toBe('env://bar')

  process.env.SECRET = 'Hush!'
  await vault.initialize()
  expect(await vault.get('SECRET')).toBe('Hush!')
  // Secrets are not affected.
  process.env.SECRET = 'Smash!'
  expect(await vault.get('SECRET')).toBe('Hush!')
})
