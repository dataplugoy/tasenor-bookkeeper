import { ImportAction } from '../import'
import { TasenorElement } from './elements'

/**
 * Definition of the how the direction plays out in interactive process.
 */
export type DirectionsType = 'action' | 'ui' | 'complete'

/**
 * Definition of direction data.
 */
export interface DirectionsData {
  type: DirectionsType
  element?: TasenorElement
  action?: ImportAction
}

/**
 * Data describing possible directions forward from the given interactive process state.
 */
export class Directions {
  type: DirectionsType
  element?: TasenorElement
  action?: ImportAction

  constructor(obj: DirectionsData) {
    this.type = obj.type
    this.element = obj.element
    this.action = obj.action
  }

  /**
   * Construct JSON data of the member fields that has been set.
   * @returns
   */
  toJSON(): DirectionsData {
    const ret: DirectionsData = {
      type: this.type
    }
    if (this.element) {
      ret.element = this.element
    }
    if (this.action) {
      ret.action = this.action
    }
    return ret
  }

  /**
   * Check if the direction can be determined without user intervention.
   */
  isImmediate(): boolean {
    return this.type === 'action'
  }

  /**
   * Check if there are no directions forward.
   */
  isComplete(): boolean {
    return this.type === 'complete'
  }
}
