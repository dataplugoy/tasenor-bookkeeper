import { mute, unmute, NormalTokenPayload, TokenAudience, Secret, Token, TOKEN_ISSUER } from '@dataplug/tasenor-common'
import { tokens, vault } from '../src'
import jwt from 'jsonwebtoken'

beforeAll(() => {
  mute()
})
afterAll(() => {
  unmute()
})

const SECRET = 'ABCD1234'

test('Sign token and check validity', async () => {
  process.env.VAULT_URL = 'env://'
  process.env.SECRET = SECRET
  await vault.initialize()
  const token = await tokens.sign({
    owner: 'root@localhost',
    feats: {},
    plugins: []
  }, 'refresh')
  // Sanity checks.
  expect(typeof token === 'string').toBeTruthy()
  expect(token.length > 32).toBeTruthy()
  // Check the token.
  const payload = tokens.verify(token, SECRET as Secret, 'refresh') as NormalTokenPayload
  expect(payload).toBeTruthy()
  expect(payload.owner).toBe('root@localhost')
  expect(payload.feats).toStrictEqual({})
  expect(payload.plugins).toStrictEqual([])
  expect(tokens.verify(token, SECRET as Secret, 'no-api' as TokenAudience)).toBeFalsy()
  expect(tokens.verify(token, 'WRONG' as Secret, 'erp')).toBeFalsy()
  expect(() => tokens.verify(token, null as unknown as Secret, 'erp')).toThrow()
})

test('Check that invalid token does not pass the check', () => {
  const SECRET = 'ABCD1234'
  const bad1 = jwt.sign({ data: {} }, SECRET, {})
  expect(tokens.verify(bad1 as Token, SECRET as Secret, 'erp')).toBeFalsy()
  const bad2 = jwt.sign({ data: { user: 'x', feats: {}, plugins: [] } }, SECRET, {})
  expect(tokens.verify(bad2 as Token, SECRET as Secret, 'erp')).toBeFalsy()
  const bad3 = jwt.sign({ data: { user: 'x', feats: {}, plugins: [] } }, SECRET, { issuer: 'Bad' })
  expect(tokens.verify(bad3 as Token, SECRET as Secret, 'erp')).toBeFalsy()
  const bad4 = jwt.sign({ data: { user: 'x', feats: {}, plugins: [] } }, SECRET, { issuer: TOKEN_ISSUER })
  expect(tokens.verify(bad4 as Token, SECRET as Secret, 'erp')).toBeFalsy()
  const bad5 = jwt.sign({ data: { user: 'x', feats: {}, plugins: [] } }, SECRET, { issuer: TOKEN_ISSUER, expiresIn: -5 })
  expect(tokens.verify(bad5 as Token, SECRET as Secret, 'erp')).toBeFalsy()
  const bad6 = jwt.sign({ data: { user: 'x', feats: {}, plugins: [] } }, SECRET, { audience: 'bad-api', issuer: TOKEN_ISSUER, expiresIn: 60 })
  expect(tokens.verify(bad6 as Token, SECRET as Secret, 'erp')).toBeFalsy()
})
