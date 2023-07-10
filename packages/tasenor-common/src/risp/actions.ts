import { PluginCode } from '../types'
import { RenderingProps } from './rendering'

/**
 * Readability helper to specify that a string is being used as a trigger name.
 */
export type ActionName = string

/**
* Payload of `debug` action.
*/
export interface DebugAction {
  readonly type: 'debug'
}

/**
 * Payload of the `patch` action.
 */
export interface PatchAction {
  readonly type: 'patch'
  url: string
  objectWrapLevel?: number
  errorMessage?: string
  successMessage?: string
}
export function isPatchAction(obj: unknown): obj is PatchAction {
  return typeof obj === 'object' && obj !== null && 'url' in obj && 'type' in obj && obj.type === 'patch'
}

/**
 * Payload of `post` action.
 */
export interface PostAction {
  readonly type: 'post'
  url: string
  objectWrapLevel?: number
  errorMessage?: string
  successMessage?: string
}
export function isPostAction(obj: unknown): obj is PostAction {
  return typeof obj === 'object' && obj !== null && 'url' in obj && 'type' in obj && obj.type === 'post'
}

/**
* An action for storing a plugin or general settings.
*/
export interface SaveSettingsAction {
  readonly type: 'saveSettings'
  backend?: boolean
  plugin: PluginCode
}

/**
 * An action definition containing all Tasenor and RISP actions.
 */
export type TasenorAction = DebugAction | PatchAction | PostAction | SaveSettingsAction

/**
 * An action definition collection.
 */
export interface Actions {
  [key: string]: TasenorAction | TasenorAction[]
}

/**
 * A successful result retuned by the action handler.
 */
export interface SuccessfulActionResult {
  success: true
  result: unknown
}

/**
 * A failure result retuned by the action handler.
 */
export interface FailedActionResult {
  success: false
  message: string
}

/**
 * A result retuned by the action handler.
 */
export type ActionResult = SuccessfulActionResult | FailedActionResult

/**
 * A function processing an action.
 */
export interface ActionHandler {
  (action: TasenorAction, props: RenderingProps): Promise<ActionResult>
}
