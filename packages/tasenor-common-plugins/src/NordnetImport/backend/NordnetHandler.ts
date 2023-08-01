import { ImportStateText, NO_SEGMENT, SegmentId, TextFileLine } from '@tasenor/common'
import { NotImplemented, Process, ProcessFile, TransactionImportHandler } from '@tasenor/common-node'

/**
 * Import implementation for Coinbase CSV format.
 */
export class NordnetHandler extends TransactionImportHandler {

  constructor() {
    super('NordnetImport')
    this.importOptions = {
      parser: 'csv',
      numericFields: ['Summa', 'Kurssi', 'Määrä', 'Kokonaiskulut'],
      requiredFields: [],
      textField: 'Tapahtumatyyppi',
      totalAmountField: 'Summa',
      csv: { useFirstLineHeadings: true, columnSeparator: '\t' }
    }
  }

  canHandle(file: ProcessFile): boolean {
    return file.firstLineMatch(/^\s*Id\tKirjausp.iv.\sKauppap.iv.\sMaksup.iv./)
  }

  segmentId(line: TextFileLine): SegmentId | typeof NO_SEGMENT {
    if (['LAINAKORKO'].includes(line.columns.Tapahtumatyyppi)) {
      return super.segmentId(line, ['Salkku', 'Summa', 'Saldo', 'Maksupäivä', 'Kauppapäivä', 'Kirjauspäivä', 'Valuutta', 'Vaihtokurssi'])
    }
    if (line.columns.Vahvistusnumero) {
      return line.columns.Vahvistusnumero
    }
    throw new NotImplemented(`Importer does not yet recognize ${JSON.stringify(line.columns)}.`)
    // return NO_SEGMENT
  }

  time(line: TextFileLine): Date | undefined {
    return line.columns['Kirjauspäivä'] ? new Date(line.columns['Kirjauspäivä']) : undefined
  }

  /**
   * Convert typical punctuations to parseable number and return numeric value.
   * @param s
   */
  num(str: string): number {
    return parseFloat(str.replace(',', '.').replace(/ /g, ''))
  }

  async segmentation(process: Process, state: ImportStateText<'initial'>, files: ProcessFile[]): Promise<ImportStateText<'segmented'>> {

    const result = await this.segmentationCSV(process, state, files)

    // Fix missing currencies.
    for (const fileName of Object.keys(result.files)) {
      const file = result.files[fileName]
      for (let n = 0; n < file.lines.length; n++) {
        const { columns } = file.lines[n]

        if (columns.Valuutta === '') {
          if (columns.Valuuttakurssi === '1' || columns.Vaihtokurssi === '1') {
            columns.Valuutta = process.config.currency as string
          }
          if (columns.Tapahtumatyyppi === 'OSINKO') {
            const match = / ([A-Z]{3})\/OSAKE$/.exec(columns.Tapahtumateksti)
            if (match) {
              columns.Valuutta = match[1]
            }
          }
        }

        if (columns.Kokonaiskulut && !columns['Kokonaiskulut Valuutta']) {
          columns['Kokonaiskulut Valuutta'] = columns.Valuutta
        }
      }
    }

    return this.segmentationPostProcess(result)
  }
}
