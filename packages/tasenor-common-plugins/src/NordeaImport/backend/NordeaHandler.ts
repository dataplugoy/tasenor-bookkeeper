import { NO_SEGMENT, SegmentId, TextFileLine } from '@tasenor/common'
import { ProcessFile, TransactionImportHandler } from '@tasenor/common-node'

/**
 * Import implementation for Nordea CSV format.
 */
export class NordeaHandler extends TransactionImportHandler {

  constructor() {
    super('NordeaImport')

    this.importOptions = {
      parser: 'csv',
      numericFields: ['Määrä'],
      requiredFields: ['Viesti'],
      insignificantFields: ['Arvopäivä', 'Maksupäivä', 'Maksajan viite', 'Kirjauspäivä', 'Tapahtuma', 'Kuitti', 'BIC'],
      textField: 'Viesti',
      totalAmountField: 'Määrä',
      csv: {
        trimLines: true,
        cutFromBeginning: 2,
        useFirstLineHeadings: true,
        columnSeparator: '\t'
      }
    }
  }

  canHandle(file: ProcessFile): boolean {
    return file.firstLineMatch(/^Tilinumero\tFI\d+$/) && file.thirdLineMatch(/^Kirjauspäivä\tArvopäivä\tMaksupäivä\tMäärä\tSaaja\/Maksaja\tTilinumero\tBIC\tTapahtuma\tViite\tMaksajan viite\tViesti\tKortinnumero\tKuitti$/)
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
