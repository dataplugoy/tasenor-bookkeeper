import { Process } from './Process'
import { DatabaseError } from '../error'
import { KnexDatabase } from '../database'
import { ID, Directions, ImportAction, ImportState } from '@dataplug/tasenor-common'

/**
 * A basic information of the processing step.
 */
export interface ProcessStepData {
  processId?: ID
  number: number
  state: ImportState
  handler: string
  action?: ImportAction
  directions?: Directions
  started?: Date
  finished?: Date
}

/**
 * Data of the one step in the process including possible directions and action taken to the next step, if any.
 */
export class ProcessStep {

  process: Process

  id: ID
  processId: ID
  number: number
  state: ImportState
  handler: string
  started: Date | undefined
  finished: Date | undefined
  directions?: Directions
  action?: ImportAction | undefined

  constructor(obj: ProcessStepData) {
    this.processId = obj.processId || null
    this.number = obj.number
    this.state = obj.state
    this.handler = obj.handler
    this.directions = obj.directions ? new Directions(obj.directions) : undefined
    this.action = obj.action
    this.started = obj.started
    this.finished = obj.finished
  }

  toString(): string {
    return `ProcessStep ${this.number} of Process #${this.processId}`
  }

  /**
   * Get a reference to the database.
   */
  get db(): KnexDatabase {
    return this.process.db
  }

  /**
   * Save the process info to the database.
   */
  async save(): Promise<ID> {
    if (this.id) {
      await this.db('process_steps').update(this.toJSON()).where({ id: this.id })
      return this.id
    } else {
      this.started = new Date()
      this.id = (await this.db('process_steps').insert(this.toJSON()).returning('id'))[0].id
      if (this.id) return this.id
      throw new DatabaseError(`Saving process ${JSON.stringify(this.toJSON)} failed.`)
    }
  }

  /**
   * Get the loaded process information as JSON object.
   * @returns
   */
  toJSON(): ProcessStepData {
    return {
      processId: this.processId,
      number: this.number,
      state: this.state,
      directions: this.directions,
      handler: this.handler,
      action: this.action,
      started: this.started,
      finished: this.finished
    }
  }

  /**
   * Set directions and update database.
   * @param db
   * @param directions
   */
  async setDirections(db: KnexDatabase, directions: Directions): Promise<void> {
    this.directions = directions
    await db('process_steps').update({ directions: directions.toJSON() }).where({ id: this.id })
  }
}
