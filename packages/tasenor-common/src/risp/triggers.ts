import { Value } from '../types'
import { ActionResult } from './actions'
import { RenderingProps } from './rendering'

/**
* A trigger is a data packet initiated by some activity in the application.
* For example user interaction on UI component. Triggers are mapped to the
* action handlers when used in RISP.
*/
export type Trigger = OnChangeTrigger | OnClickTrigger | { readonly type: string }

/**
 * This trigger is activated, when value of an input is changed.
 */
export interface OnChangeTrigger {
  readonly type: 'onChange'
  name: string
  value: Value
}

/**
 * This trigger is activated by clicking on some target.
 */
export interface OnClickTrigger {
  readonly type: 'onClick'
}

/**
 * The handler function is a function converting the trigger data to the action result.
 */
export interface TriggerHandler {
  (trigger: Trigger, props: RenderingProps): Promise<ActionResult>
}
