/**
 * A keyboard handler
 */
export declare class Cursor {
  disableHandler(): void
  enableHandler(): void
  handle(key: string): void
  addModal(name: string, hooks: Record<string, (cursor: Cursor, key: string) => void>)
  removeModal(name: string)
}
