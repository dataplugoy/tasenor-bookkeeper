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
        'Fees and/or Spread': 'Fees'
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

    return 0
  }

  async init(files: ProcessFile[]): Promise<ProcessFile[]> {
    if (this.version === 2) {
      // Clean up trash from the beginning.
      for (const file of files) {
        const data = file.decode()
        const lines = data.split('\n').splice(7)
        if (!/^Timestamp,Transaction Type,Asset,Quantity Transacted,Spot Price Currency,Spot Price at Transaction,Subtotal,Total/.test(lines[0])) {
          throw new Error('Coinbase parser is not able to understand the format.')
        }
        file.set(lines.join('\n'))
      }
    }
    return files
  }

  segmentId(line: TextFileLine): SegmentId | typeof NO_SEGMENT {
    if (this.version === 2) {
      return super.segmentId(line)
    }
    if (['deposit', 'withdrawal'].includes(line.columns.type)) {
      return line.columns['transfer id']
    }
    return line.columns['trade id']
  }

  time(line: TextFileLine): Date | undefined {
    if (this.version === 2) {
      return line.columns.Timestamp ? new Date(line.columns.Timestamp) : undefined
    }
    return line.columns.time ? new Date(line.columns.time) : undefined
  }
}
