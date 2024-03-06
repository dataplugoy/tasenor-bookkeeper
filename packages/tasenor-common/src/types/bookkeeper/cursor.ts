import Opaque from 'ts-opaque'

/**
 * A string definition of a key press as in `keydown` event listener.
 */
export type KeyboardShortcut = Opaque<string, 'KeyboardShortcut'>

/**
 * A handler function collection for keyboard shortcuts.
 */
export type ShortcutHandlers = Record<string, (Cursor, KeyboardShortcut) => undefined | { preventDefault: true }>

export interface CursorOptions {
  subitemExitUp: boolean
  subitemExitDow: boolean
  subitemUpStopOnNull: boolean
  entryColumn: number
  noScroll: boolean
}

/**
 * A screen component that is part of the navigation.
 */
declare class TopologyComponent {
  name: string
}

/**
 * A keyboard handler.
 */
export declare class Cursor {

  page: string
  componentX: null | number
  componentY: null | number
  index: null | number
  column: null | number
  row: null | number

  disableHandler(): void
  enableHandler(): void
  getComponent(): TopologyComponent
  handle(key: string): void
  addModal(name: string, hooks: Record<string, (cursor: Cursor, key: string) => void>)
  removeModal(name: string)
  resetSelected(): void
  registerMenu(handlers: ShortcutHandlers)
  registerTools(handlers: ShortcutHandlers | null)
  selectPage(page: string, hooks: Record<string, (cursor: Cursor, key: string) => void>): void
  setCell(column: null|number, row: null|number)
  setComponent(name: string): void
  setIndex(index: null|number, options?: CursorOptions)
  topologyChanged(): void
}
