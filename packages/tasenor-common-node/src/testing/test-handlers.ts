import fs from 'fs'
import path from 'path'
import { CoinbaseHandler } from '../../../tasenor-common-plugins/src/CoinbaseImport/backend/CoinbaseHandler'
import { KrakenHandler } from '../../../tasenor-common-plugins/src/KrakenImport/backend/KrakenHandler'
import { LynxHandler } from '../../../tasenor-common-plugins/src/LynxImport/backend/LynxHandler'
import { NordeaHandler } from '../../../tasenor-common-plugins/src/NordeaImport/backend/NordeaHandler'
import { NordnetHandler } from '../../../tasenor-common-plugins/src/NordnetImport/backend/NordnetHandler'
import { TITOHandler } from '../../../tasenor-common-plugins/src/TITOImport/backend/TITOHandler'
import { TransactionImportHandler } from '..'

/**
 * Mapping from handler class names to instances.
 */
const handlers: Record<string, TransactionImportHandler> = {
  // Typescript commonly screws up, if there are slight version differencies. Force type.
  Coinbase: new CoinbaseHandler() as unknown as TransactionImportHandler,
  Nordea: new NordeaHandler() as unknown as TransactionImportHandler,
  Nordnet: new NordnetHandler() as unknown as TransactionImportHandler,
  Lynx: new LynxHandler() as unknown as TransactionImportHandler,
  Kraken: new KrakenHandler() as unknown as TransactionImportHandler,
  TITO: new TITOHandler() as unknown as TransactionImportHandler,
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
