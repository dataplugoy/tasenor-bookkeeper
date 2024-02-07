import Store from './Stores/Store'
import Cursor from './Stores/Cursor'
import Settings from './Stores/Settings'
import Catalog from './Stores/Catalog'
import { setGlobalComponents, Knowledge } from '@tasenor/common'

export const settings = new Settings()
export const store = new Store(settings)
export const cursor = new Cursor(store)
export const catalog = new Catalog(store)
store.setCatalog(catalog)
export const knowledge = new Knowledge()

// TODO: Lot of clean up needed to get rid of this global approach.
setGlobalComponents(
  store,
  catalog,
  cursor,
  settings,
  knowledge
)
