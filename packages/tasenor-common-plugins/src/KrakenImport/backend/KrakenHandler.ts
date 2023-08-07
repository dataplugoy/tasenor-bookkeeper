import { DirectoryPath, ImportStateText, NO_SEGMENT, SegmentId, TextFileLine } from '@tasenor/common'
import { NotImplemented, Process, ProcessFile, TransactionImportHandler } from '@tasenor/common-node'

/**
 * Import implementation for Coinbase CSV format.
 */
export class KrakenHandler extends TransactionImportHandler {

  constructor() {
    super('KrakenImport')
    this.importOptions = {
      parser: 'csv',
      numericFields: ['amount', 'balance', 'fee'],
      requiredFields: [],
      textField: 'type',
      totalAmountField: 'amount',
      csv: { useFirstLineHeadings: true, columnSeparator: ',' }
    }
  }

  get path(): DirectoryPath {
    return __dirname as DirectoryPath
  }

  canHandle(file: ProcessFile): boolean {
    return file.firstLineMatch(/^"txid","refid","time","type","subtype","aclass","asset","amount","fee","balance"/) || file.firstLineMatch(/^"txid","refid","time","type","aclass","asset","amount","fee","balance"/)
  }

  time(line: TextFileLine): Date | undefined {
    return new Date(line.columns.time.replace(' ', 'T') + 'Z')
  }

  /**
   * Convert Kraken specific assets to commonly used tickers.
   * @param aclass
   * @param asset
   */
  ticker(aclass: string, asset: string): string | undefined {
    if (aclass === undefined || asset === undefined) return undefined
    if (aclass !== 'currency') {
      throw new NotImplemented(`Kraken handler does not recognize asset class '${aclass}'.`)
    }
    if (asset.startsWith('Z')) {
      return asset.substring(1)
    }
    const map = {
      BCH: 'BCH',
      EOS: 'EOS',
      SOL: 'SOL',
      XETH: 'ETH',
      XLTC: 'LTC',
      XMLN: 'MLN',
      XTZ: 'XTZ',
      XXBT: 'BTC',
      XXLM: 'XLM',
      XXRP: 'XRP',
      XZEC: 'ZEC',
    }
    if (map[asset]) {
      return map[asset]
    }
    throw new NotImplemented(`Kraken handler does not recognize asset '${asset}'.`)
  }

  /**
   * Use transaction IDs for segment ID.
   * @param line
   * @returns
   */
  segmentId(line: TextFileLine): SegmentId | typeof NO_SEGMENT {
    if (line.columns && line.columns.txid) {
      return line.columns.refid || NO_SEGMENT
    }
    return NO_SEGMENT
  }

  async segmentation(process: Process, state: ImportStateText<'initial'>): Promise<ImportStateText<'segmented'>> {
    const segmented = await super.segmentation(process, state, process.files)
    for (const fileName of Object.keys(segmented.files)) {
      const file = segmented.files[fileName]
      for (let n = 0; n < file.lines.length; n++) {
        const { aclass, asset } = file.lines[n].columns
        // Get the standard ticker.
        const ticker = this.ticker(aclass, asset)
        if (ticker) {
          file.lines[n].columns.ticker = ticker
        }
      }
    }
    return segmented
  }
}
