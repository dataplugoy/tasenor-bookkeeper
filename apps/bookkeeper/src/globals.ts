import Store from './Stores/Store'
import Cursor from './Stores/Cursor'
import Settings from './Stores/Settings'
import Catalog from './Stores/Catalog'
import { setGlobalComponents, Knowledge, Store as StoreType, Catalog as CatalogType } from '@tasenor/common'

export const settings = new Settings()
export const store = new Store(settings)
export const cursor = new Cursor(store)
export const catalog = new Catalog(store)
store.setCatalog(catalog)
export const knowledge = new Knowledge()

// TODO: Lot of clean up needed to get rid of this global approach.
// TODO: Improve definitions to be more accurate so that we don't need force types here.
setGlobalComponents(
  store as unknown as StoreType,
  catalog as unknown as CatalogType,
  cursor,
  settings,
  knowledge
)
