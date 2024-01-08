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
      numericFields: ['amount', 'balance'],
      requiredFields: [],
      textField: 'type',
      totalAmountField: 'amount',
      csv: { useFirstLineHeadings: true }
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
    for (const file of files) {
      const data = file.decode()
      const lines = data.split('\n').splice(7)
      if (!/^Timestamp,Transaction Type,Asset,Quantity Transacted,Spot Price Currency,Spot Price at Transaction,Subtotal,Total/.test(lines[0])) {
        throw new Error('Coinbase parser is not able to understand the format.')
      }
      file.set(lines.join('\n'))
    }
    return files
  }

  segmentId(line: TextFileLine): SegmentId | typeof NO_SEGMENT {
    if (['deposit', 'withdrawal'].includes(line.columns.type)) {
      return line.columns['transfer id']
    }
    return line.columns['trade id']
  }

  time(line: TextFileLine): Date | undefined {
    return line.columns.time ? new Date(line.columns.time) : undefined
  }
}
