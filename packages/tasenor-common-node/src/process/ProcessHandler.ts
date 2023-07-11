import { ProcessFile } from './ProcessFile'
import { ProcessingSystem } from './ProcessingSystem'
import { Process } from './Process'
import { NotImplemented } from '../error'
import { Directions, ImportAction, ImportState, ProcessConfig } from '@dataplug/tasenor-common'

/**
 * A handler taking care of moving between process states.
 */
export class ProcessHandler {

  system: ProcessingSystem
  name: string

  constructor(name: string) {
    this.name = name
  }

  /**
   * Attach this handler to the processing system during the registration.
   * @param system
   */
  connect(system: ProcessingSystem): void {
    this.system = system
  }

  /**
   * Check if we are able to handle the given file.
   * @param file
   */
  canHandle(file: ProcessFile): boolean {
    throw new NotImplemented(`A handler '${this.name}' cannot check file '${file.name}', since canHandle() is not implemented.`)
  }

  /**
   * Check if we are able to append the given file to the process.
   * @param file
   */
  canAppend(file: ProcessFile): boolean {
    throw new NotImplemented(`A handler '${this.name}' cannot append file '${file.name}', since canAppend() is not implemented.`)
  }

  /**
   * Check if the state is either successful `true` or failed `false` or not yet complete `undefined`.
   * @param state
   */
  checkCompletion(state: ImportState): boolean | undefined {
    throw new NotImplemented(`A handler '${this.name}' cannot check state '${JSON.stringify(state)}', since checkCompletion() is not implemented.`)
  }

  /**
   * Execute an action to the state in order to produce new state. Note that state is cloned and can be modified to be new state.
   * @param action
   * @param state
   * @param files
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async action(process: Process, action: ImportAction, state: ImportState, files: ProcessFile[]): Promise<ImportState> {
    throw new NotImplemented(`A handler '${this.name}' for files ${files.map(f => `'${f}''`).join(', ')} does not implement action()`)
  }

  /**
   * Construct intial state from the given data.
   * @param file
   */
  startingState(files: ProcessFile[]): ImportState {
    throw new NotImplemented(`A handler '${this.name}' for file ${files.map(f => `'${f}''`).join(', ')} does not implement startingState()`)
  }

  /**
   * Figure out possible directions from the given state.
   * @param state
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getDirections(state: ImportState, config: ProcessConfig): Promise<Directions> {
    throw new NotImplemented(`A handler '${this.name}' for state '${JSON.stringify(state)}' does not implement getDirections()`)
  }

  /**
   * See if it is possible rollback a process.
   * @param step
   */
  async rollback(process: Process, state: ImportState): Promise<ImportState> {
    throw new NotImplemented(`A handler '${this.name}' does not implement rollback()`)
  }
}

/**
 * A collection of process handlers.
 */
export type ProcessHandlerMap = {
  [key: string]: ProcessHandler
}
