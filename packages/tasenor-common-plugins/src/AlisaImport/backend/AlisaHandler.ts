import { DirectoryPath, ImportStateText, NO_SEGMENT, SegmentId, TextFileLine } from '@tasenor/common'
import { NotImplemented, Process, ProcessFile, TransactionImportHandler } from '@tasenor/common-node'

/**
 * Import implementation for Alisa CSV format.
 */
export class AlisaHandler extends TransactionImportHandler {

  constructor() {
    super('AlisaImport')
    this.importOptions = {
      parser: 'csv',
      numericFields: [],
      requiredFields: [],
      textField: 'Message',
      totalAmountField: 'Amount',
      csv: { useFirstLineHeadings: true, columnSeparator: '\t' }
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
    return true
  }

}
