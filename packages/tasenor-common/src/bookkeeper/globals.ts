/* eslint-disable no-var */
/**
 * Accessors for Bookkeeper global components and info.
 * @module
 */
import { Cursor } from '../types/bookkeeper/cursor'
import { Catalog } from '../types/bookkeeper/catalog'
import { Store } from '../types/bookkeeper/store'
import { Settings } from '../types/bookkeeper/settings'
import { Knowledge } from './Knowledge'
import { DirectoryPath } from '../types'

declare global {
  var _serverRoot: DirectoryPath
  var _store: Store
  var _catalog: Catalog
  var _cursor: Cursor
  var _settings: Settings
  var _knowledge: Knowledge
}

/**
 * Store instance references for the application.
 * @param store
 * @param catalog
 * @param cursor
 * @param settings
 * @param knowledge
 */
export function setGlobalComponents(store: Store, catalog: Catalog, cursor: Cursor, settings: Settings, knowledge: Knowledge): void {
  global._store = store
  global._catalog = catalog
  global._cursor = cursor
  global._settings = settings
  global._knowledge = knowledge
}

/**
 * Get the store instance.
 */
export function haveCursor(): Cursor {
  if (!_cursor) {
    throw new Error('Call to haveCursor() before global components set with setGlobalComponents().')
  }
  return _cursor
}

/**
* Get the catalog instance.
*/
export function haveCatalog(): Catalog {
  if (!_catalog) {
    throw new Error('Call to haveCatalog() before global components set with setGlobalComponents().')
  }
  return _catalog
}

/**
 * Get the store instance.
 */
export function haveStore(): Store {
  if (!_store) {
    throw new Error('Call to haveStore() before global components set with setGlobalComponents().')
  }
  return _store
}

/**
 * Get the catalog instance.
 */
export function haveSettings(): Settings {
  if (!_settings) {
    throw new Error('Call to haveSettings() before global components set with setGlobalComponents().')
  }
  return _settings
}

/**
* Get the catalog knowledge base.
*/
export function haveKnowledge(): Knowledge {
  if (!_knowledge) {
    throw new Error('Call to haveKnowledge() before global components set with setGlobalComponents().')
  }
  return _knowledge
}

/**
 * Set the global server root path.
 */
export function setServerRoot(path: string) {
  _serverRoot = path as DirectoryPath
}

/**
 * Get the path to the root of the running server.
 */
export function getServerRoot(): string {
  // eslint-disable-next-line no-undef
  if (!_serverRoot) {
    throw new Error('Server root is not set.')
  }
  // eslint-disable-next-line no-undef
  return _serverRoot
}
