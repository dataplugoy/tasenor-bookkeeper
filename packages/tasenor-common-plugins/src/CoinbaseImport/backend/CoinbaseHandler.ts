import { NO_SEGMENT, SegmentId, TextFileLine } from '@dataplug/tasenor-common'
import { ProcessFile, TransactionImportHandler } from '@dataplug/tasenor-common-node'

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

  canHandle(file: ProcessFile): boolean {
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