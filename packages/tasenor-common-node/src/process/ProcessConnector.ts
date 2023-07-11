import { ID } from '@dataplug/tasenor-common'

/**
 * A connector interface for querying information, applying results and running various hooks.
 */
export interface ProcessConnector {
  initialize(server: unknown): Promise<void>
  getTranslation(text: string, language: string): Promise<string>
  resultExists(processId: ID, args: unknown): Promise<boolean>
  applyResult(processId: ID, args: unknown): Promise<Record<string, unknown>>
  rollback(processId: ID): Promise<boolean>
  success(state: unknown): Promise<void>
  waiting(state: unknown, directions): Promise<void>
  fail(state: unknown): Promise<void>
}

export const defaultConnector = {
  async initialize(): Promise<void> {
    console.log(new Date(), 'Connector initialized.')
  },
  async resultExists(processId: ID, args: unknown): Promise<boolean> {
    return false
  },
  async applyResult(): Promise<Record<string, unknown>> {
    console.log(new Date(), 'Result received.')
    return {}
  },
  async success(): Promise<void> {
    console.log(new Date(), 'Process completed.')
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async waiting(): Promise<void> {
  },
  async fail(): Promise<void> {
    console.error(new Date(), 'Process failed.')
  },
  async getTranslation(text: string) {
    return text
  },
  async rollback(processId: ID): Promise<boolean> {
    return true
  }

}
