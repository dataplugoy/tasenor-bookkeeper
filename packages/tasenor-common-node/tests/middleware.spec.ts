import { describe, expect, test } from '@jest/globals'
import jwt from 'jsonwebtoken'
import { tasenorInitialStack } from '../src/net/middleware'

describe('Initial middleware stack', () => {

  test('logger accepts tokens without payload data', () => {
    const logger = tasenorInitialStack({ origin: '*' })[0]
    const token = jwt.sign({ foo: 'bar' }, 'whatever')
    const req = { method: 'GET', query: { token }, headers: {}, ip: '127.0.0.1', hostname: 'localhost', originalUrl: `/x?token=${token}` }
    let called = false
    expect(() => logger(req as never, {} as never, () => { called = true })).not.toThrow()
    expect(called).toBe(true)
  })
})
