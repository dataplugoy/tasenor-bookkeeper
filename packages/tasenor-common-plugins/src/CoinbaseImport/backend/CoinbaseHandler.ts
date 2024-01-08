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

  canHandle(file: ProcessFile): boolean {
    console.log(file.decode())
    return file.firstLineMatch(/^(portfolio,)?type,time,amount,balance,amount.balance unit,transfer id,trade id,order id/)
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
