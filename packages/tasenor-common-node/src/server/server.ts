import { Server } from 'http'
import { Express } from 'express'
import { log, error, waitPromise } from '@tasenor/common'
import { killPortUser } from '../system'

let expressListener: Server

/**
 * Try to establish a listener for the server port.
 */
async function listener(app: Express, port: number, main: (s: Server) => void): Promise<boolean> {
  return new Promise((resolve) => {
    log('Setting up listener...')

    expressListener = app.listen(port,
      ).on('error', (err) => {
        error('Launching failed:', err + '')
        if ('code' in err && err.code === 'EADDRINUSE') {
          error('Trying to kill existing process...')
          killPortUser(port)
        }
        resolve(false)
      }).on('listening', async () => {
        main(expressListener)
        resolve(true)
      })
    })
}

/**
 * Launch the listener for a server.
 */
export async function listen(app: Express, port: number | string, main: (s: Server) => void) {
  while (true) {
    if (await listener(app, parseInt(`${port}`), main)) break
    await waitPromise(2000)
  }
}

/**
 * Shut down the server.
 */
export function killListener() {
  expressListener.close()
}
