/**
 * Some utility type definitions for processing.
 */

/**
 * Configuration data for a process.
 */
export type ProcessConfig = Record<string, unknown>

/**
 * The name of the process.
 */

export type ProcessName = string

/**
  * How the process input data is encoded.
  */
export type FileEncoding = 'utf-8' | 'base64' | 'json'

/**
 * Overall status of the process.
 *
 *  * INCOMPLETE - Something has stopped the process before it has been finished properly.
 *  * WAITING - The process is currently waiting for external input.
 *  * SUCCEEDED - The process is completed successfully.
 *  * FAILED - The process is completed unsuccessfully.
 *  * CRASHED - A handler has crashed at some point and process is halted.
 *
 * @enum
 */
export type ProcessStatus = 'INCOMPLETE' | 'WAITING' | 'SUCCEEDED' | 'FAILED' | 'CRASHED' | 'ROLLEDBACK'

/**
 * An ID for database entries.
 */
export type RealID = number
export type ID = RealID | null

export const isRealID = (id: unknown): id is RealID => typeof id === 'number'
export const isID = (id: unknown): id is ID => isRealID(id) || id === null

/**
 * Response for single process step fetch.ProcessStepModelData
 */
export type ProcessStepModelData = {
  id: ID
  processId?: ID
  number: number
  started: Date
  finished: Date
  handler: string
  directions: null | Record<string, unknown>
  action: null | Record<string, unknown>
  state: Record<string, unknown>
}

/**
 * File data for imported files.
 */
export type ProcessFileModelData = {
  id: ID
  processId?: ID
  name: string
  type: string // TODO: Should be MIME-type
  encoding: FileEncoding
  data: string
}

/**
 * Response for process listing.
 */
export type ProcessModelData = {
  id: ID
  ownerId: ID
  name: ProcessName
  config: ProcessConfig
  complete: boolean
  successful: boolean
  currentStep: number
  status: ProcessStatus
  error?: string
  created: Date
}

/**
 * Response for single process fetch.
 */
export type ProcessModelDetailedData = {
  id: ID
  ownerId: ID
  name: ProcessName
  config: ProcessConfig
  complete: boolean
  successful: boolean
  currentStep: number
  steps: ProcessStepModelData[]
  files: ProcessFileModelData[]
  status: ProcessStatus
  error?: string
  created: Date
}
