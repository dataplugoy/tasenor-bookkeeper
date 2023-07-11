import { Process } from './Process'
import { ProcessFile, ProcessFileData } from './ProcessFile'
import { ProcessStep } from './ProcessStep'
import { ProcessHandler, ProcessHandlerMap } from './ProcessHandler'
import { ProcessConnector } from './ProcessConnector'
import { ProcessName, ProcessConfig, ID } from '@dataplug/tasenor-common'
import { InvalidArgument } from '../error'
import { KnexDatabase } from '../database'

/**
 * An instance of the full processing system.
 */
export class ProcessingSystem {

  db: KnexDatabase
  handlers: ProcessHandlerMap = {}
  connector: ProcessConnector
  logger: {
    info: (...msg) => void
    error: (...msg) => void
  }

  /**
   * Initialize the system and set the database instance for storing process data.
   * @param db
   */
  constructor(db: KnexDatabase, connector: ProcessConnector) {
    this.db = db
    this.logger = {
      info: (...msg) => console.log(new Date(), ...msg),
      error: (...msg) => console.error(new Date(), ...msg)
    }
    this.connector = connector
  }

  /**
   * Get the translation from the connector.
   * @param language
   * @param text
   * @returns
   */
  async getTranslation(text: string, language: string): Promise<string> {
    return this.connector.getTranslation(text, language)
  }

  /**
   * Register new handler class for processing.
   * @param handler
   */
  register(handler: ProcessHandler): void {
    if (!handler) {
      throw new InvalidArgument('A handler was undefined.')
    }
    if (!handler.name) {
      throw new InvalidArgument('A handler without name cannot be registered.')
    }
    if (handler.name in this.handlers) {
      throw new InvalidArgument(`The handler '${handler.name}' is already defined.`)
    }
    if (handler.name.length > 32) {
      throw new InvalidArgument(`The handler name '${handler.name}' is too long.`)
    }
    handler.system = this
    this.handlers[handler.name] = handler
  }

  /**
   * Initialize new process and save it to the database.
   * @param type
   * @param name
   * @param file
   * @returns New process that is already in crashed state, if no handler
   */
  async createProcess(name: ProcessName, files: ProcessFileData[], config: ProcessConfig): Promise<Process> {
    // Set up the process.
    const process = new Process(this, name, config)
    await process.save()

    // Check if we have files.
    if (files.length < 1) {
      await process.crashed(new InvalidArgument('No files given to create a process.'))
      return process
    }

    // Save the first file and attach it to the process.
    const file = files[0]
    const processFile = new ProcessFile(file)
    process.addFile(processFile)
    await processFile.save(this.db)

    // Find the handler.
    let selectedHandler: ProcessHandler | null = null
    for (const handler of Object.values(this.handlers)) {
      try {
        if (handler.canHandle(processFile)) {
          selectedHandler = handler
          break
        }
      } catch (err) {
        await process.crashed(err)
        return process
      }
    }
    if (!selectedHandler) {
      await process.crashed(new InvalidArgument(`No handler found for the file ${file.name} of type ${file.type}.`))
      return process
    }

    // Check if the handler accepts the rest of the files.
    for (let i = 1; i < files.length; i++) {
      const processFile = new ProcessFile(files[i])
      // await processFile.save(this.db)
      if (!selectedHandler.canAppend(processFile)) {
        await process.crashed(new InvalidArgument(`The file ${files[i].name} of type ${files[i].type} cannot be appended to handler.`))
        return process
      }
      process.addFile(processFile)
      await processFile.save(this.db)
    }

    // Create initial step using the handler.
    let state
    try {
      state = selectedHandler.startingState(process.files)
    } catch (err) {
      await process.crashed(err)
      return process
    }
    const step = new ProcessStep({
      number: 0,
      handler: selectedHandler.name,
      state
    })

    process.addStep(step)
    await step.save()

    process.currentStep = 0
    await process.save()
    this.logger.info(`Created process ${process}.`)

    // Find directions forward from the initial state.
    await this.checkFinishAndFindDirections(selectedHandler, step)

    return process
  }

  /**
   * Check if we are in the finished state and if not, find the directions forward.
   */
  async checkFinishAndFindDirections(handler: ProcessHandler, step: ProcessStep): Promise<void> {
    let result
    try {
      result = handler.checkCompletion(step.state)
    } catch (err) {
      return step.process.crashed(err)
    }

    if (result === undefined) {
      let directions
      try {
        directions = await handler.getDirections(step.state, step.process.config)
      } catch (err) {
        return step.process.crashed(err)
      }
      await step.setDirections(this.db, directions)
    } else {
      // Process is finished.
      step.directions = undefined
      step.action = undefined
      step.finished = new Date()
      await step.save()
      step.process.complete = true
      step.process.successful = result
      await step.process.save()
    }
    await step.process.updateStatus()
  }

  /**
   * Get the named handler or throw an error if not registered.
   * @param name
   * @returns
   */
  getHandler(name: string): ProcessHandler {
    if (!(name in this.handlers)) {
      throw new InvalidArgument(`There is no handler for '${name}'.`)
    }
    return this.handlers[name]
  }

  /**
   * Load the process data from the disk.
   * @param id
   * @returns
   */
  async loadProcess(id: ID): Promise<Process> {
    const process = new Process(this, null)
    await process.load(id)
    return process
  }
}
