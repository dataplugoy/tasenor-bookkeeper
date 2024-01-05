import { AccountNumber, Language, PluginCode, ReportColumnDefinition, ReportData, ReportID, ReportItem, ReportLine, ReportMeta, ReportOptions, ReportQueryParams, StockBookkeeping, StockChangeData, Version } from '@tasenor/common'
import { ReportPlugin } from '@tasenor/common-node'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
dayjs.extend(quarterOfYear)

class AssetReport extends ReportPlugin {
  constructor() {
    super('assets' as ReportID)

    this.schemes = undefined

    this.code = 'AssetReport' as PluginCode
    this.title = 'Asset Report'
    this.version = '1.0.0' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><path d="M0,0h24v24H0V0z" fill="none"/></g><g><g><path d="M14,5H5v14h14v-9h-5V5z M8,17c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S8.55,17,8,17z M8,13 c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S8.55,13,8,13z M8,9C7.45,9,7,8.55,7,8s0.45-1,1-1s1,0.45,1,1S8.55,9,8,9z" opacity=".3"/><circle cx="8" cy="8" r="1"/><path d="M15,3H5C3.9,3,3.01,3.9,3.01,5L3,19c0,1.1,0.89,2,1.99,2H19c1.1,0,2-0.9,2-2V9L15,3z M19,19H5V5h9v5h5V19z"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="16" r="1"/></g></g></svg>'
    this.releaseDate = '2024-01-05'
    this.use = 'backend'
    this.type = 'report'
    this.description = 'List of tradable assets in all accounts.'

    this.languages = {
      en: {
        'report-assets': 'Assets',
        'column-purchase-value': 'Purchase Value',
        'column-average-value': 'Average Value',
        'column-count': 'Count',
      },
      fi: {
        'report-assets': 'Omaisuuserät',
        'column-purchase-value': 'Ostohinta',
        'column-average-value': 'Keskihinta',
        'column-count': 'Kpl',
      }
    }
  }

  getLanguages(): Language[] {
    return ['en', 'fi']
  }

  getReportOptions(): ReportOptions {
    return {
      quarter1: 'radio:1',
      quarter2: 'radio:1',
      quarter3: 'radio:1',
      full: 'radio:1:default'
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getColumns(id: ReportID, entries: ReportData[], options: ReportOptions, settings: ReportMeta): Promise<ReportColumnDefinition[]> {
    return [
      {
        name: 'title',
        title: '',
        type: 'name'
      },
      {
        name: 'count',
        title: '{column-count}',
        type: 'numeric'
      },
      {
        name: 'average',
        title: '{column-average-value}',
        type: 'numeric'
      },
      {
        name: 'value',
        title: '{column-purchase-value}',
        type: 'numeric'
      },
    ]
  }

  async extraSQLCondition(): Promise<string | null> {
    return "entry.data->'stock' IS NOT NULL"
  }

  /**
   * Gather ticker counts for each account.
   */
  preProcess(id: ReportID, entries: ReportData[], options: ReportQueryParams, settings: ReportMeta, columns: ReportColumnDefinition[]): ReportLine[] {

    const stock: Record<AccountNumber, { data: StockChangeData, time: Date }[]> = {}
    const lines: ReportLine[] = []

    entries.forEach(entry => {
      if (!stock[entry.number]) {
        stock[entry.number] = []
      }
      stock[entry.number].push({
        data: entry.data as StockChangeData,
        time: new Date(entry.date)
      })
    })

    Object.keys(stock).forEach(number => {
      const bookkeeping = new StockBookkeeping(number)
      bookkeeping.applyAll(stock[number])
      lines.push({
        tab: 0,
        hideTotal: true,
        required: true,
        bold: true,
        name: number, // TODO: Add account name too
        amounts: { }
      })
      // Note: we could construct also detailed changes at this point, if we want detailed version of the report.
      for (const [, asset, amount] of bookkeeping.totals()) {
        if (amount) {
          const value = bookkeeping.value(asset)
          lines.push({
            tab: 4,
            name: asset,
            amounts: {
              count: amount, // TODO: Decimal number instead of money value.
              average: value / amount,
              value
            }
          })
        }
      }
      lines.push({ paragraphBreak: true })
    })

    return lines
  }

  postProcess(id, data) {
    return data
  }
}

export default AssetReport
