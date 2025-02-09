import { DirectoryPath, TextFileLine } from '@tasenor/common'
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
      requiredFields: ['Type', 'CounterpartyAccountNumber'],
      textField: 'Message',
      totalAmountField: 'Amount',
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

  time(line: TextFileLine): Date | undefined {
    const time = line.columns.BookingDate
    const re = time && /^(\d\d)\.(\d\d)\.(\d\d\d\d)$/.exec(time)
    if (re && re !== null) {
      return dayjs(sprintf('%04d-%02d-%02d 12:00:00Z', re[3], re[2], re[1])).toDate()
    }
    throw new Error(`Alisa import cannot figure out date from ${JSON.stringify(time)}.`)
  }

}
