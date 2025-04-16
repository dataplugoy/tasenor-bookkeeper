import { DirectoryPath, NO_SEGMENT, SegmentId, TextFileLine } from '@tasenor/common'
import { ProcessFile, TransactionImportHandler } from '@tasenor/common-node'
import dayjs from 'dayjs'
import { sprintf } from 'sprintf-js'

/**
 * Import implementation for Alisa CSV format.
 */
export class AlisaHandler extends TransactionImportHandler {

  constructor() {
    super('AlisaImport')
    this.importOptions = {
      parser: 'csv',
      numericFields: ['Amount', 'AmountPaid'],
      requiredFields: ['Type', 'Account'],
      textField: 'Message',
      totalAmountField: 'Amount',
      fieldRemapping: {
        CounterpartyAccountNumber: 'Account',
        CounterpartyName: 'Name',
        CounterpartySpecification: 'Specification',
      },
      csv: {
        cutFromBeginning: 8,
        useFirstLineHeadings: true,
        columnSeparator: ';',
        trimLines: true,
      }
    }
  }

  get path(): DirectoryPath {
    return __dirname as DirectoryPath
  }

  canHandle(file: ProcessFile): boolean {
    const data = file.decode()
    const lines = data.substring(0, 150).split('\n')
    const lookup = ['sep=', 'AccountNumber', 'AccountName', 'AccountType', 'CurrencyCode', 'StartDate', 'EndDate', '']

    for (let i = 0; i < 8; i++) {
      if (lines[i].split(';')[0].trim() !== lookup[i]) {
        return false
      }
    }

    this.importOptions.csv = this.importOptions.csv || {}
    this.importOptions.csv.columnSeparator = lines[0].trim().split('=')[1]

    return true
  }

  segmentId(line: TextFileLine): SegmentId | typeof NO_SEGMENT {
    // Note: pure number is bad as segment ID. See ActionEngine.ts
    return line && line.columns ? 'tx' + line.columns.TransactionNumber : NO_SEGMENT
  }

  time(line: TextFileLine): Date | undefined {
    const time = line.columns.BookingDate
    const re = time && /^(\d\d)\.(\d\d)\.(\d\d\d\d)$/.exec(time)
    if (re && re !== null) {
      return dayjs(sprintf('%04d-%02d-%02d 12:00:00Z', re[3], re[2], re[1])).toDate()
    }
    throw new Error(`Alisa import cannot figure out date from ${JSON.stringify(time)}.`)
  }

}
