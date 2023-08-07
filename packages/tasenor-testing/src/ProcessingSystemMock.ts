/* eslint-disable @typescript-eslint/no-unused-vars */
import { ID, ProcessConfig, ProcessName } from '@tasenor/common'
import { UnitTestImportConnector } from './UnitTestImportConnector'
import { KnexDatabase, Process, ProcessConnector, ProcessFile, ProcessFileData, ProcessHandler, ProcessHandlerMap, ProcessStep } from '@tasenor/common-node'

/**
 * Processing system mock for unit testing.
 */
export class SystemMock {
  db: KnexDatabase
  handlers: ProcessHandlerMap = {}
  connector: ProcessConnector
  logger: {
    info: (...msg) => void
    error: (...msg) => void
  }

  constructor() {
    this.connector = new UnitTestImportConnector()
  }

  async getTranslation(text: string, language: string): Promise<string> {
    return this.connector.getTranslation(text, language)
  }

  register(handler: ProcessHandler): void {
    //
  }

  async createProcess(name: ProcessName, filed: ProcessFileData[], config: ProcessConfig): Promise<Process> {
    return new Process(this, name, config)
  }

  async checkFinishAndFindDirections(handler: ProcessHandler, step: ProcessStep): Promise<void> {
    //
  }

  getHandler(name: string): ProcessHandler {
    return this.handlers[name]
  }

  async loadProcess(id: ID): Promise<Process> {
    return this.createProcess('dummy', [new ProcessFile({ name: 'file', encoding: 'utf-8', data: 'Hello' })], {})
  }
}
