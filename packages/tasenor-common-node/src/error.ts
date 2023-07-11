/**
 * Error types for processing and an exception used to ask more information from UI.
 *
 * @module tasenor-common-node/src/error
 */

import { TasenorElement } from '@dataplug/tasenor-common'

export class ProcessingError extends Error {}
export class InvalidFile extends ProcessingError {}
export class InvalidArgument extends ProcessingError {}
export class BadState extends ProcessingError {}
export class NotImplemented extends ProcessingError {}
export class NotFound extends ProcessingError {}
export class DatabaseError extends ProcessingError {}
export class SystemError extends ProcessingError {}

/**
 * Special exception to halt processing in order to require more configuration information from UI.
 */
export class AskUI extends Error {
  public element: TasenorElement

  constructor(element: TasenorElement) {
    super('Need more information from UI.')
    this.element = element
  }
}

export function isAskUI(obj: unknown): obj is AskUI {
  return (obj instanceof Error) && 'element' in obj
}
