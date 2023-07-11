import csvParse from 'csv-parse'
import { BadState, NotImplemented } from '../error'
import { ProcessFile } from '../process/ProcessFile'
import { ProcessHandler } from '../process/ProcessHandler'
import { ImportAction, isImportAction, isImportAnswerAction, isImportConfigureAction, isImportOpAction, ProcessConfig, SegmentId, Directions, TextFileLine, ImportCSVOptions, ImportState, ImportStateText, isImportRetryAction, ImportCustomOptions, TransactionImportOptions } from '@dataplug/tasenor-common'
import { Process } from '../process/Process'

/**
 * Utility class to provide tools for implementing any text file based process handler.
 */
export class TextFileProcessHandler extends ProcessHandler {

  public importOptions: TransactionImportOptions = {
    parser: 'csv',
    numericFields: [],
    requiredFields: [],
    insignificantFields: [],
    sharedFields: [],
    textField: null,
    totalAmountField: null
  }

  /**
   * Split the file to lines and keep line numbers with the lines. Mark state type as initial state.
   * @param file
   * @returns
   */
  startingState(processFiles: ProcessFile[]): ImportStateText<'initial'> {
    const files: Record<string, { lines: TextFileLine[] }> = {}

    for (const processFile of processFiles) {
      const original = processFile.decode()

      let lines: TextFileLine[]

      if (this.importOptions.custom) {
        // Use custom splitter if defined.
        lines = this.importOptions.custom.splitToLines(original).map((text, idx) => ({
          text,
          line: idx,
          columns: {}
        }))
      } else {
        // Otherwise just split from new lines.
        lines = original.replace(/\n+$/, '').split('\n').map((text, line) => ({
          text,
          line,
          columns: {}
        }))
      }

      files[processFile.name] = { lines }
    }

    return {
      stage: 'initial',
      files
    }
  }

  /**
   * Check the state type is matching to 'complete'.
   * @param state
   */
  checkCompletion(state: ImportState): boolean | undefined {
    if (state.stage === 'executed') {
      return true
    }
    return undefined
  }

  /**
   * A hook to check alternative directions from initial state.
   * @param state
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async needInputForSegmentation(state: ImportState, config: ProcessConfig): Promise<Directions | false> {
    return false
  }

  /**
   * A hook to check alternative directions from segmented state.
   * @param state
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async needInputForClassification(state: ImportState, config: ProcessConfig): Promise<Directions | false> {
    return false
  }

  /**
   * A hook to check alternative directions from classified state.
   * @param state
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async needInputForAnalysis(state: ImportState, config: ProcessConfig): Promise<Directions | false> {
    return false
  }

  /**
   * A hook to check alternative directions from analyzed state.
   * @param state
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async needInputForExecution(state: ImportState, config: ProcessConfig): Promise<Directions | false> {
    return false
  }

  /**
   * Run steps in order 'segmentation', 'classification', 'analysis', 'execution'.
   * @param state
   * @returns
   */
  async getDirections(state: ImportState, config: ProcessConfig): Promise<Directions> {
    let input: Directions | false
    let directions: Directions
    switch (state.stage) {
      case 'initial':
        input = await this.needInputForSegmentation(state, config)
        if (input) return input
        directions = new Directions({
          type: 'action',
          action: { op: 'segmentation' }
        })
        break
      case 'segmented':
        input = await this.needInputForClassification(state, config)
        if (input) return input
        directions = new Directions({
          type: 'action',
          action: { op: 'classification' }
        })
        break
      case 'classified':
        input = await this.needInputForAnalysis(state, config)
        if (input) return input
        directions = new Directions({
          type: 'action',
          action: { op: 'analysis' }
        })
        break
      case 'analyzed':
        input = await this.needInputForExecution(state, config)
        if (input) return input
        directions = new Directions({
          type: 'action',
          action: { op: 'execution' }
        })
        break
      default:
        throw new BadState('Cannot find directions from the current state.')
    }
    return directions as unknown as Directions
  }

  /**
   * Call subclass implementation for each action.
   * @param action
   * @param state
   * @param files
   */
  async action(process: Process, action: ImportAction, state: ImportState, files: ProcessFile[]): Promise<ImportState> {

    if (!isImportAction(action)) {
      throw new BadState(`Action is not import action ${JSON.stringify(action)}`)
    }

    if (isImportRetryAction(action)) {
      this.system.logger.info(`Executing 'retry' action on process #${process.id}.`)
      process.status = 'INCOMPLETE'
      process.error = undefined
      await process.save()
      return state
    }

    if (isImportOpAction(action)) {
      this.system.logger.info(`Executing '${action.op}' action on process #${process.id}.`)
      switch (action.op) {
        case 'analysis':
        case 'classification':
        case 'segmentation':
        case 'execution':
          return this[action.op](process, state, files, process.config)
        default:
          throw new BadState(`Cannot parse action ${JSON.stringify(action)}`)
      }
    }

    if (isImportConfigureAction(action)) {
      this.system.logger.info(`Updating 'configuration' on process #${process.id}.`)
      Object.assign(process.config, action.configure)
      await process.save()
    }

    if (isImportAnswerAction(action)) {
      this.system.logger.info(`Updating 'answers' on process #${process.id}.`)
      if (!process.config.answers) {
        process.config.answers = {}
      }
      const answers = process.config.answers as Record<SegmentId, Record<string, unknown>>
      for (const segmentId of Object.keys(action.answer)) {
        answers[segmentId] = answers[segmentId] || {}
        for (const variable of Object.keys(action.answer[segmentId])) {
          answers[segmentId][variable] = action.answer[segmentId][variable]
        }
      }
      await process.save()
    }

    return state
  }

  /**
   * This function must implement gathering of each line together that forms together one import activity.
   * @param state
   * @param files
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async segmentation(process: Process, state: ImportState, files: ProcessFile[], config: ProcessConfig): Promise<ImportState> {
    throw new NotImplemented(`A class ${this.constructor.name} does not implement segmentation().`)
  }

  /**
   * This function must implement gathering of each line together that forms together one import activity.
   * @param state
   * @param files
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async classification(process: Process, state: ImportState, files: ProcessFile[], config: ProcessConfig): Promise<ImportState> {
    throw new NotImplemented(`A class ${this.constructor.name} does not implement classification().`)
  }

  /**
   * This function must implement conversion from classified data to the actual executable operations.
   * @param state
   * @param files
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async analysis(process: Process, state: ImportState, files: ProcessFile[], config: ProcessConfig): Promise<ImportState> {
    throw new NotImplemented(`A class ${this.constructor.name} does not implement analysis().`)
  }

  /**
   * This function must implement applying the result in practice.
   * @param state
   * @param files
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execution(process: Process, state: ImportState, files: ProcessFile[], config: ProcessConfig): Promise<ImportState> {
    throw new NotImplemented(`A class ${this.constructor.name} does not implement execution().`)
  }

  /**
   * Parse a single line of CSV.
   * @param line
   * @param options
   * @returns
   */
  async parseCsvLine(line: string, options: ImportCSVOptions = {}): Promise<string[]> {
    return new Promise((resolve, reject) => {
      csvParse(line, {
        delimiter: options.columnSeparator || ',',
        skip_lines_with_error: !!options.skipErrors
      }, function (err, out) {
        if (err) {
          reject(err)
        } else {
          resolve(out[0])
        }
      })
    })
  }

  /**
   * Go through each file and each line and add CSV interpretation of the content to each line.
   * @param state
   * @param options
   * @returns The original state that has been modified by adding CSV parsed field `columns`.
   */
  async parseCSV(state: ImportStateText<'initial'>, options: ImportCSVOptions = {}): Promise<ImportStateText<'segmented'>> {

    // Heading names per column.
    let headings: string[] = []
    let dropLines = options.cutFromBeginning || 0
    // Run loop over all files.
    let firstLine = true
    for (const fileName of Object.keys(state.files)) {

      // Process each line from CSV.
      for (let n = 0; n < state.files[fileName].lines.length; n++) {
        if (dropLines) {
          dropLines--
          continue
        }
        const line: TextFileLine = { ...state.files[fileName].lines[n] }
        const text = options.trimLines ? line.text.trim() : line.text

        // Collect or define headings on the first line.
        if (firstLine) {
          firstLine = false
          if (options.useFirstLineHeadings) {
            headings = await this.parseCsvLine(text, options)
            const headCount = {}
            for (let i = 0; i < headings.length; i++) {
              headCount[headings[i]] = headCount[headings[i]] || 0
              headCount[headings[i]]++
              if (headCount[headings[i]] > 1) {
                headings[i] = `${headings[i]}${headCount[headings[i]]}`
              }
            }
            continue
          } else {
            const size = (await this.parseCsvLine(text, options)).length
            for (let i = 0; i < size; i++) {
              headings.push(`${i}`)
            }
          }
        }
        // Map each column to its heading name.
        const columns: Record<string, string> = {}
        const pieces = text.trim() !== '' ? await this.parseCsvLine(text, options) : null
        if (pieces) {
          pieces.forEach((column, index) => {
            if (index < headings.length) {
              columns[headings[index]] = column
            } else {
              columns['+'] = columns['+'] || ''
              columns['+'] += column + '\n'
            }
          })
          line.columns = columns

          // Add it back with columns.
          state.files[fileName].lines[n] = line
        }
      }
    }

    const newState: ImportStateText<'segmented'> = {
      ...state as ImportStateText<'initial'>, // We just filled in columns.
      stage: 'segmented'
    }

    return newState
  }

  /**
   * Handler for pure custom handler.
   */
  async parseCustom(state: ImportStateText<'initial'>, options: ImportCustomOptions): Promise<ImportStateText<'segmented'>> {
    for (const fileName of Object.keys(state.files)) {
      for (const line of state.files[fileName].lines) {
        line.columns = options.splitToColumns(line.text)
      }
    }

    const newState: ImportStateText<'segmented'> = {
      ...state as ImportStateText<'initial'>, // We just filled in columns.
      stage: 'segmented'
    }

    return newState
  }

  /**
   * Split a string to fixed length fields given as name and length mapping.
   */
  parseFixedLength(src: string, offsets: Record<string, number>, conversions: Record<string, (string) => string>) {
    const ret = {}
    const keys = Object.keys(offsets)
    for (let n = 0, i = 0; i < keys.length; i++) {
      const column = src.substring(n, n + offsets[keys[i]])
      ret[keys[i]] = column.trim()
      if (conversions[keys[i]]) {
        ret[keys[i]] = conversions[keys[i]](ret[keys[i]])
      }
      n += offsets[keys[i]]
    }
    return ret
  }
}
