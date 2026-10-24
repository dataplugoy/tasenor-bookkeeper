import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'
import http from 'http'
import { AddressInfo } from 'net'
import { mute } from '../src/logging'
import { net, netConfigure } from '../src/net'
import { Url } from '../src/types'

describe('Net library', () => {
  let server: http.Server
  let api: Url

  beforeAll(async () => {
    mute()
    server = http.createServer((req, res) => {
      const status = req.url === '/forbidden' ? 403 : 401
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: `Server message ${status}.` }))
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    api = `http://127.0.0.1:${(server.address() as AddressInfo).port}` as Url
    netConfigure({ sites: { [api]: { refreshToken: 'refresh' as never } } })
  })

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve))
  })

  test('keeps the server message of 401 and 403 when token cannot be refreshed', async () => {
    expect(await net.DELETE(`${api}/forbidden` as Url)).toEqual({ status: 403, success: false, message: 'Server message 403.' })
    expect(await net.POST(`${api}/auth` as Url, { user: 'x' })).toEqual({ status: 401, success: false, message: 'Server message 401.' })
  })
})
