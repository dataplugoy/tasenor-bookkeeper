import { ImportStateText, NO_SEGMENT, ProcessConfig, warning, month, Language, ucfirst } from '@dataplug/tasenor-common'
import { InvalidFile, Process, ProcessFile, TransactionImportHandler } from '@dataplug/tasenor-common-node'

// Matcher for ticker and ISIN code.
const TICKER_ISIN_REGEX = /^\s*([-A-Za-z0-9 .]+)\(([A-Z0-9]+)\)/

// If set, pick only transactions concerning this ticker.
const DEBUG_TICKER = null
// If set, pick only transactions from this section in CSV file:
// 'Deposits & Withdrawals', 'Interest', 'Trades', 'Corporate Actions', 'Dividends', 'Withholding Tax', 'Fees'.
const DEBUG_TYPE = null

/**
 * Import implementation for Lynx CSV format.
 */
export class LynxHandler extends TransactionImportHandler {

  constructor() {
    super('LynxImport')
    this.importOptions = {
      parser: 'custom',
      requiredFields: ['Amount', 'Quantity'],
      numericFields: ['Amount', 'Quantity', 'Proceeds', 'T. Price', 'MTM in Currency', 'Comm/Fee', 'PerAsset', 'Value'],
      textField: null,
      totalAmountField: null,
    }
  }

  canHandle(file: ProcessFile): boolean {
    const header = 'Statement,Header,Field Name,Field Value\n'
    const str = file.decode()
    return str.charCodeAt(0) === 0xfeff &&
      str.substr(1, header.length) === header
  }

  /**
   * Special pre-processing for Lynx semi CSV-format. Collect headers and map content of interest to columns.
   * @param state
   * @returns
   */
  async parse(state: ImportStateText<'initial'>, config: ProcessConfig): Promise<ImportStateText<'segmented'>> {

    const language = config.language as Language

    const sectionsOfInterest = new Set([
      'Fees',
      'Interest',
      'Trades',
      'Deposits & Withdrawals',
      'Withholding Tax',
      'Dividends',
      'Corporate Actions'
    ])

    // Map headers of different sections to the data content and costruct columns.
    for (const fileName of Object.keys(state.files)) {
      const file = state.files[fileName]
      let headers: string[] = []
      for (let n = 0; n < file.lines.length; n++) {
        // Some info lines has bad quotes, so ignore errors.
        const columns = await this.parseCsvLine(file.lines[n].text, { columnSeparator: ',', skipErrors: true })

        if (!columns || !sectionsOfInterest.has(columns[0])) {
          continue
        }
        // Pick headers.
        if (columns[1] === 'Header') {
          headers = columns
          continue
        }
        // Skip summaries and notes.
        if (columns[1] === 'Total' || columns[1] === 'SubTotal' || columns[1] === 'Notes') {
          continue
        }
        if (columns[2] && columns[2].startsWith('Total')) {
          continue
        }

        // Skip dividend section with `Code` to avoid duplicate dividends.
        if (headers[0] === 'Dividends' && headers[6] === 'Code') {
          continue
        }

        if (DEBUG_TICKER) {
          if (columns[0] === 'Deposits & Withdrawals' || columns[0] === 'Interest') continue
          if (columns[0] === 'Trades' && columns[5] !== DEBUG_TICKER) continue
          if (columns[0] === 'Corporate Actions' && !columns[6].startsWith(DEBUG_TICKER)) continue
          if (columns[0] === 'Dividends' && !columns[4].startsWith(DEBUG_TICKER)) continue
          if (columns[0] === 'Withholding Tax' && !columns[4].startsWith(DEBUG_TICKER)) continue
        }
        if (DEBUG_TYPE) {
          if (columns[0] !== DEBUG_TYPE) continue
        }

        type LynxValues = {
          Type: string
          Subtype: string
          Description: string
          ISIN?: string
          Ticker?: string
          Amount?: string
          PerAsset?: string
          Currency?: string
          Action?: string
          SubAction?: string
          Ratio?: string
          Quantity?: string
          Month?: string
          Year?: string
          TickerInText?: string
          RatioDecimal?: string
        }

        const values: LynxValues = { Type: headers[0], Subtype: '', Description: '' }
        for (let i = 2; i < columns.length; i++) {
          values[headers[i] || `Column${i}`] = columns[i]
        }

        // Add ISIN and Ticker for dividends and tax
        if (['Dividends', 'Withholding Tax'].includes(values.Type)) {
          const match = TICKER_ISIN_REGEX.exec(values.Description)
          if (!match) {
            throw new InvalidFile(`Failed to extract ticker and ISIN from a line '${values.Description}'.`)
          }
          values.Ticker = match[1].trim()
          values.ISIN = match[2]
          // Parse more fields from dividend.
          if (values.Type === 'Dividends') {
            let text = values.Description.replace(TICKER_ISIN_REGEX, '').trim()
            text = text.replace(values.Ticker, '')
            text = text.replace(/\(\s*\)/g, '')
            text = text.replace(/\s\s+/g, ' ')
            let perAsset = /\b([0-9.]+)\s+per\s+share\b/i.exec(text)
            if (!perAsset) {
              const regex = new RegExp(`${values.Currency}\\s+([0-9.]+)\\s`)
              perAsset = regex.exec(text)
            }
            if (perAsset) {
              values.PerAsset = perAsset[1]
            } else {
              warning(`Failed to find per share dividend from a line '${values.Description}'.`)
              values.PerAsset = undefined
            }
          }
        }

        // Add ISIN and Ticker for corporate actions and try to extract some info.
        if (values.Type === 'Corporate Actions') {
          let match = TICKER_ISIN_REGEX.exec(values.Description)
          if (!match) {
            throw new InvalidFile(`Failed to extract ticker and ISIN from a line '${values.Description}'.`)
          }
          values.Ticker = match[1].trim()
          values.ISIN = match[2]
          let text = values.Description.replace(TICKER_ISIN_REGEX, '').trim()
          if (text.startsWith('CUSIP/ISIN Change to ')) {
            values.Action = 'Renaming'
            text = text.substring(21)
          } else {
            match = /^(\w+)/.exec(text)
            if (!match) {
              throw new InvalidFile(`Cannot extract corporate action from a line '${values.Description}'.`)
            }
            values.Action = ucfirst(match[1])
            text = text.replace(/^\w+/, '').trim()
          }
          match = /^\((\w+)\)/.exec(text)
          values.SubAction = match ? ucfirst(match[1]) : ''
          text = text.replace(/^\((\w+)\)/, '').trim()
          match = /\b(\d+)\s+for\s+(\d+)\s/i.exec(text)
          if (match) {
            values.Ratio = `${parseInt(match[1])}/${parseInt(match[2])}`
            values.RatioDecimal = `${parseInt(match[1]) / parseInt(match[2])}`
          } else {
            values.Ratio = ''
            values.RatioDecimal = ''
          }
          match = /.*\(([A-Z0-9 .]+),\s+.*?\)/.exec(text)
          values.TickerInText = match ? match[1] : ''
        }

        // Rename some currency dependent fields.
        if (values[`Comm in ${config.currency}`] !== undefined) {
          values['Comm in Currency'] = values[`Comm in ${config.currency}`]
          delete values[`Comm in ${config.currency}`]
        }
        if (values[`MTM in ${config.currency}`] !== undefined) {
          values['MTM in Currency'] = values[`MTM in ${config.currency}`]
          delete values[`MTM in ${config.currency}`]
        }

        // Trim the quantity's confusing desimal point.
        if (values.Quantity && values.Type === 'Trades') {
          values.Quantity = values.Quantity.replace(/,(\d\d\d)$/g, '$1')
        }

        // Fix Date/Time.
        if (values['Date/Time']) {
          values['Date/Time'] = values['Date/Time'].replace(',', '')
        }

        // Pick interest period.
        if (values.Type === 'Interest') {
          const re = /\s([A-Z][a-z][a-z])-(\d\d\d\d)$/.exec(values.Description)
          values.Month = re ? ucfirst(await this.getTranslation(month(re[1]) || '', language)) : ''
          values.Year = re ? re[2] : ''
        }

        // Ensure at least empty `Action` for easier processing in rules.
        values.Action = values.Action || ''

        file.lines[n].columns = values
      }
    }

    const newState: ImportStateText<'segmented'> = {
      ...state as ImportStateText<'initial'>,
      stage: 'segmented'
    }
    return newState
  }

  /**
   * Resolve date string for column data extracted.
   * @param columns
   */
  date(columns: Record<string, string>): string {
    // Mapping from types to date fields.
    const dateField = {
      Fees: 'Date',
      Interest: 'Date',
      Dividends: 'Date',
      Trades: 'Date/Time',
      'Corporate Actions': 'Date/Time',
      'Deposits & Withdrawals': 'Settle Date',
      'Withholding Tax': 'Date'
    }

    let date = columns[dateField[columns.Type]]
    if (!date) {
      throw new InvalidFile(`Unable to determine timestamp from ${JSON.stringify(columns)}.`)
    }
    if (date.length < 12) {
      date += 'T00:00:00Z'
    }

    return date
  }

  /**
   * Pair dividends and witholding taxes. Other lines are kept as they are.
   * @param process
   * @param state
   * @param files
   * @returns
   */
  async segmentation(process: Process, state: ImportStateText<'initial'>): Promise<ImportStateText<'segmented'>> {

    // Parse to get column content.
    const parsed: ImportStateText<'segmented'> = await this.parse(state, process.config)
    parsed.segments = {}

    // Collect dividend line numbers per ISIN + date combination.
    const actionLines: Record<string, number[]> = {}
    const dividendSegments: Record<string, string> = {}

    for (const fileName of Object.keys(parsed.files)) {
      const file = parsed.files[fileName]
      for (let n = 0; n < file.lines.length; n++) {
        const { Type, ISIN } = file.lines[n].columns

        if (Type === 'Dividends') {

          const date = this.date(file.lines[n].columns)
          const key = `${date} ${ISIN}`
          if (dividendSegments[key] === undefined) {
            const segmentId = this.segmentId(file.lines[n])
            if (segmentId === NO_SEGMENT) {
              throw new InvalidFile(`Failed to find segment for ${JSON.stringify(file.lines[n].columns)}`)
            }
            dividendSegments[key] = segmentId
          }
          file.lines[n].segmentId = dividendSegments[key]
          const segmentId = dividendSegments[key]
          parsed.segments[segmentId] = parsed.segments[segmentId] || { id: segmentId, time: new Date(date), lines: [] }
          parsed.segments[segmentId].lines.push({ number: n, file: fileName })

        } else if (Type === 'Corporate Actions') {

          const Date = this.date(file.lines[n].columns)
          const key = `${Date} ${ISIN}`
          actionLines[key] = actionLines[key] || []
          actionLines[key].push(n)
        }
      }
    }

    // Go through withholding taxes and share the segment ID with the dividend and the tax.
    // Recognize tax adjustments and collect them for further processing.
    // For other lines, get own segment ID.
    const taxFixSegments: Record<string, string> = {}
    for (const fileName of Object.keys(parsed.files)) {
      const file = parsed.files[fileName]
      for (let n = 0; n < file.lines.length; n++) {

        const { Type, ISIN, Description } = file.lines[n].columns

        if (!Type) {
          continue
        }

        // Get the timestamp.
        const date = this.date(file.lines[n].columns)
        const time = new Date(date)

        if (Type === 'Withholding Tax') {

          // Group withholding tax entries with the corresponding dividend, if possible.
          const key = `${date} ${ISIN}`
          let segmentId
          if (dividendSegments[key] === undefined) {
            // Sometimes there are corrections afterwards. Let us then just adjust withholding taxes.
            segmentId = taxFixSegments[key] || this.segmentId(file.lines[n])
            if (segmentId === NO_SEGMENT) {
              throw new InvalidFile(`Failed to find segment for ${JSON.stringify(file.lines[n].columns)}`)
            }
            taxFixSegments[key] = segmentId
            file.lines[n].columns.Subtype = 'Adjustment'
          } else {
            segmentId = dividendSegments[key]
            file.lines[n].columns.Subtype = 'Tax'
          }
          file.lines[n].segmentId = segmentId
          parsed.segments[segmentId] = parsed.segments[segmentId] || { id: segmentId, time, lines: [] }
          parsed.segments[segmentId].lines.push({ number: n, file: fileName })

        } else if (Type === 'Corporate Actions') {

          const key = `${date} ${ISIN}`
          if (!actionLines[key]) {
            throw new InvalidFile(`Unable to find matching corporate action for a line '${Description}.`)
          }
          // Use the first segmentId for all lines.
          let segmentId
          for (const line of actionLines[key]) {
            if (file.lines[line].segmentId) {
              continue
            }
            if (!segmentId) {
              segmentId = this.segmentId(file.lines[n])
              parsed.segments[segmentId] = { id: segmentId, time, lines: [] }
            }
            file.lines[line].segmentId = segmentId
            parsed.segments[segmentId].lines.push({ number: line, file: fileName })
          }

        } else if (Type === 'Deposits & Withdrawals') {

          // Determine subtype for the line.
          if (/Electronic Fund Transfer/.test(Description)) {
            file.lines[n].columns.Subtype = 'Deposit'
          } else if (/Disbursement Initiated by/.test(Description)) {
            file.lines[n].columns.Subtype = 'Withdrawal'
          } else if (/^Adjustment:/.test(Description)) {
            file.lines[n].columns.Subtype = 'Adjustment'
          } else {
            warning(`Unable to determine subtype for Deposits & Withdrawals '${Description}'.`)
          }

        }

        // For those not yet assigned, just record a single line segment.
        if (!file.lines[n].segmentId) {
          const segmentId = this.segmentId(file.lines[n])
          if (segmentId !== NO_SEGMENT) {
            file.lines[n].segmentId = segmentId
            parsed.segments[segmentId] = parsed.segments[segmentId] || { id: segmentId, time, lines: [] }
            parsed.segments[segmentId].lines.push({ number: n, file: fileName })
          }
        }
      }
    }

    const final = await this.segmentationPostProcess(parsed)
    this.debugSegmentation(final)

    return final
  }
}
