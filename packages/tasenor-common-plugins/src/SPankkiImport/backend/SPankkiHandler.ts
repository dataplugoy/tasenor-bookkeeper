import { DirectoryPath, NO_SEGMENT, SegmentId, TextFileLine } from '@tasenor/common'
import { ProcessFile, TransactionImportHandler } from '@tasenor/common-node'

/**
 * Import implementation for S-Pankki CSV format.
 */
export class SPankkiHandler extends TransactionImportHandler {

  constructor() {
    super('SPankkiImport')

    this.importOptions = {
      parser: 'csv',
      numericFields: ['Summa'],
      requiredFields: ['Saajan nimi', 'Maksupäivä'],
      insignificantFields: ['Saajan BIC-tunnus', 'Arkistointitunnus', 'Kirjauspäivä'],
      textField: 'Viesti',
      totalAmountField: 'Summa',
      csv: {
        trimLines: true,
        cutFromBeginning: 0,
        useFirstLineHeadings: true,
        columnSeparator: ';'
      }
    }
  }

  get path(): DirectoryPath {
    return __dirname as DirectoryPath
  }

  canHandle(file: ProcessFile): boolean {
    return file.firstLineMatch(/^Kirjauspäivä;Maksupäivä;Summa;Tapahtumalaji;Maksaja;Saajan nimi;Saajan tilinumero;Saajan BIC-tunnus;Viitenumero;Viesti;Arkistointitunnus$/)
  }

  segmentId(line: TextFileLine): SegmentId | typeof NO_SEGMENT {
    return line.columns ? this.hash(line) : NO_SEGMENT
  }

  time(line: TextFileLine): Date | undefined {
    const match = /(\d+)\.(\d+)\.(\d+)/.exec(line.columns['Maksupäivä'])
    if (match) {
      const stamp = match[3] + '-' + match[2] + '-' + match[1] + 'T12:00:00.000Z'
      return new Date(stamp)
    }
    return undefined
  }
}
