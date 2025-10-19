import { DirectoryPath, NO_SEGMENT, SegmentId, TextFileLine } from '@tasenor/common'
import { ProcessFile, TransactionImportHandler } from '@tasenor/common-node'

/**
 * Import implementation for Coinbase CSV format.
 */
export class CoinbaseHandler extends TransactionImportHandler {

  constructor() {
    super('CoinbaseImport')
    this.importOptions = {
      parser: 'csv',
      numericFields: ['amount', 'balance', 'Quantity', 'Price', 'Total', 'Subtotal', 'Fees'],
      requiredFields: [],
      textField: 'type',
      totalAmountField: 'amount',
      csv: { useFirstLineHeadings: true },
      fieldRemapping: {
        // V1
        'amount/balance unit': 'unit',
        // V2
        'Transaction Type': 'type',
        'Quantity Transacted': 'Quantity',
        'Spot Price Currency': 'Currency',
        'Spot Price at Transaction': 'Price',
        'Total (inclusive of fees and/or spread)': 'Total',
        'Fees and/or Spread': 'Fees',
        // V4
        'Price at Transaction': 'Price',
        'Price Currency': 'Currency',
      }
    }
  }

  get path(): DirectoryPath {
    return __dirname as DirectoryPath
  }

  canHandle(file: ProcessFile): boolean | number {
    if (file.firstLineMatch(/^(portfolio,)?type,time,amount,balance,amount.balance unit,transfer id,trade id,order id/)) {
      return 1
    }
    if (file.firstLineMatch(/"You can use this transaction report/)) {
      return 2
    }
    if (file.firstLineMatch(/^$/) && file.secondLineMatch(/^Transactions$/)) {
      const data = file.decode()
      const lines = data.split('\n').splice(3)
      if (!/^ID,Timestamp,Transaction Type,Asset,Quantity Transacted,Price Currency,Price at Transaction,Subtotal,Total (inclusive of fees and\/or spread),Fees and\/or Spread,Notes/.test(lines[0])) {
        return 4
      }
      if (!/^Timestamp,Transaction Type,Asset,Quantity Transacted,Spot Price Currency,Spot Price at Transaction,Subtotal,Total/.test(lines[0])) {
        return 3
      }

      throw new Error('Coinbase parser is not able to understand the column format.')
    }

    return 0
  }

  async init(files: ProcessFile[]): Promise<ProcessFile[]> {
    if (this.version === 1) {
      return files
    }
    if (this.version === 2 || this.version === 3 || this.version === 4) {
      this.importOptions.textField = 'Notes'
      // Clean up trash from the beginning.
      for (const file of files) {
        const data = file.decode()
        const lines = data.split('\n').splice(this.version === 2 ? 7 : 3)
        file.set(lines.join('\n'))
      }
      return files
    }

    throw new Error(`Coinbase import handler does not implement init() for version ${this.version}.`)
  }

  segmentId(line: TextFileLine): SegmentId | typeof NO_SEGMENT {
    if (this.version === 2 || this.version === 3 || this.version === 4) {
      return super.segmentId(line)
    }
    if (this.version === 1) {
      if (['deposit', 'withdrawal'].includes(line.columns.type)) {
        return line.columns['transfer id']
      }
      return line.columns['trade id']
    }
    throw new Error(`Coinbase import handler does not implement segmentId() for version ${this.version}.`)
  }

  time(line: TextFileLine): Date | undefined {
    if (this.version === 2 || this.version === 3 || this.version === 4) {
      return line.columns.Timestamp ? new Date(line.columns.Timestamp) : undefined
    }
    if (this.version === 1) {
      return line.columns.time ? new Date(line.columns.time) : undefined
    }
    throw new Error(`Coinbase import handler does not implement time() for version ${this.version}.`)
  }

  async segmentationColumnPostProcess(columns: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (columns.type === 'Convert') {
      const match = /Converted ([0-9.]+) (\w+) to ([0-9.]+) (\w+)/.exec(columns.Notes as string)
      if (match) {
        columns.giveAmount = parseFloat(match[1])
        columns.giveAsset = match[2]
        columns.takeAmount = parseFloat(match[3])
        columns.takeAsset = match[4]
      }
    }
    if (this.version === 4) {
      if (columns.type === 'Advanced Trade Buy') {
        //        1          2       3                 4      5   6              7   8
        // Bought 0.33694052 ETH for 0.012835268969159 BTC on ETH-BTC at 0.03781 BTC/ETH
        const match = /Bought ([0-9.]+) ([A-Z]+) for ([0-9.]+) ([A-Z]+) on ([A-Z]+)-([A-Z]+) at [0-9.]+ ([A-Z]+)\/([A-Z]+)/.exec(`${columns.Notes}`)
        if (!match) {
          throw new Error(`Unexpected format for notes: "${columns.Notes}".`)
        }
        if (match[2] !== match[5] || match[5] !== match[8] || match[4] !== match[6] || match[6] !== match[7]) {
          throw new Error(`Coin currencies did not match as expected: "${columns.Notes}"`)
        }
        columns.type = 'Advanced Convert'
        columns.takeAmount = parseFloat(match[1])
        columns.takeAsset = match[2]
        columns.giveAmount = parseFloat(match[3])
        columns.giveAsset = match[4]
      } else if (columns.type === 'Advanced Trade Sell') {
        //      1          2       3                  4      5   6              7   8
        // Sold 0.41459303 ETH for 0.0128917806326757 BTC on ETH-BTC at 0.03133 BTC/ETH
        const match = /Sold ([0-9.]+) ([A-Z]+) for ([0-9.]+) ([A-Z]+) on ([A-Z]+)-([A-Z]+) at [0-9.]+ ([A-Z]+)\/([A-Z]+)/.exec(`${columns.Notes}`)
        if (!match) {
          throw new Error(`Unexpected format for notes: "${columns.Notes}".`)
        }
        if (match[2] !== match[5] || match[5] !== match[8] || match[4] !== match[6] || match[6] !== match[7]) {
          throw new Error(`Coin currencies did not match as expected: "${columns.Notes}"`)
        }
        columns.type = 'Advanced Convert'
        columns.giveAmount = parseFloat(match[1])
        columns.giveAsset = match[2]
        columns.takeAmount = parseFloat(match[3])
        columns.takeAsset = match[4]
      }
    }
    return columns
  }
}
