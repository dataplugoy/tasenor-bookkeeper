import Opaque from 'ts-opaque'

/**
 * A string definition of a key press as in `keydown` event listener.
 */
export type KeyboardShortcut = Opaque<string, 'KeyboardShortcut'>

/**
 * A handler function collection for keyboard shortcuts.
 */
export type ShortcutHandlers = Record<string, (Cursor, KeyboardShortcut) => undefined | { preventDefault: true }>

/**
 * A keyboard handler.
 */
export declare class Cursor {
  disableHandler(): void
  enableHandler(): void
  handle(key: string): void
  addModal(name: string, hooks: Record<string, (cursor: Cursor, key: string) => void>)
  removeModal(name: string)
  resetSelected(): void
  registerMenu(handlers: ShortcutHandlers)
}
