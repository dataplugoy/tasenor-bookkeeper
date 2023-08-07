import fs from 'fs'
import path from 'path'
import { CoinbaseHandler, KrakenHandler, LynxHandler, NordeaHandler, NordnetHandler, TITOHandler } from '@tasenor/common-plugins'
import { TransactionImportHandler } from '@tasenor/common-node'

/**
 * Mapping from handler class names to instances.
 */
const handlers: Record<string, TransactionImportHandler> = {
  Coinbase: new CoinbaseHandler(),
  Nordea: new NordeaHandler(),
  Nordnet: new NordnetHandler(),
  Lynx: new LynxHandler(),
  Kraken: new KrakenHandler(),
  TITO: new TITOHandler(),
}

/**
 * Get a handler instance for testing.
 * @param name
 * @returns
 */
export function getTestHandler(className: string): TransactionImportHandler {
  if (!handlers[className]) {
    throw new Error(`No such import handler as '${className}'.`)
  }
  return handlers[className]
}

/**
 * Get handler path.
 * @param className
 * @returns
 */
export function getTestHandlerPath(className: string): string {
  const dirName = path.join(__dirname, '..', '..', '..', 'tasenor-common-plugins', 'src', `${className}Import`, 'backend')
  if (!fs.existsSync(dirName)) {
    throw new Error(`No such import handler path as '${className}'.`)
  }
  return dirName
}
