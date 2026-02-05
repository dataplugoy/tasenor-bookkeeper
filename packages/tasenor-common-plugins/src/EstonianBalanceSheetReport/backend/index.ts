import { AccountNumber, Language, PluginCode, ReportID, ReportLine, ReportOptions, Version } from '@tasenor/common'
import { ReportPlugin } from '@tasenor/common-node'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
dayjs.extend(quarterOfYear)

class EstonianBalanceSheetReport extends ReportPlugin {
  constructor() {
    // super('balance-sheet-detailed' as ReportID, 'balance-sheet' as ReportID)
    super('balance-sheet' as ReportID)

    this.schemes = new Set(['EstonianLimitedCompanyLite'])

    this.code = 'EstonianBalanceSheetReport' as PluginCode
    this.title = 'Balance Sheet Report (Estonian)'
    this.version = '1.0.14' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><path d="M0,0h24v24H0V0z" fill="none"/></g><g><g><path d="M14,5H5v14h14v-9h-5V5z M8,17c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S8.55,17,8,17z M8,13 c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S8.55,13,8,13z M8,9C7.45,9,7,8.55,7,8s0.45-1,1-1s1,0.45,1,1S8.55,9,8,9z" opacity=".3"/><circle cx="8" cy="8" r="1"/><path d="M15,3H5C3.9,3,3.01,3.9,3.01,5L3,19c0,1.1,0.89,2,1.99,2H19c1.1,0,2-0.9,2-2V9L15,3z M19,19H5V5h9v5h5V19z"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="16" r="1"/></g></g></svg>'
    this.releaseDate = '2026-02-05'
    this.use = 'backend'
    this.type = 'report'
    this.description = 'Balance sheet report translated in Finnish or English.'

    this.languages = {
      en: {
        'report-balance-sheet-detailed': 'Detailed balance sheet',
        'report-balance-sheet': 'Balance sheet'
      },
      fi: {
        'report-balance-sheet-detailed': 'Tase tilierittelyin',
        'report-balance-sheet': 'Tase'
      }
    }
  }

  forceOptions() {
    return {
      negateAssetAndProfit: true,
      addPreviousPeriod: true
    }
  }

  getLanguages(): Language[] {
    return ['fi', 'en']
  }

  getReportOptions(): ReportOptions {
    return {
      month1: 'radio:1',
      month2: 'radio:1',
      quarter1: 'radio:1',
      month4: 'radio:1',
      month5: 'radio:1',
      quarter2: 'radio:1',
      month7: 'radio:1',
      month8: 'radio:1',
      quarter3: 'radio:1',
      month10: 'radio:1',
      month11: 'radio:1',
      full: 'radio:1:default',
    }
  }

  columnTitle(id, period, options) {
    const year = dayjs(period.start_date).year()

    if (options.month1) {
      return `{${dayjs(`${year}-02-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month2) {
      return `{${dayjs(`${year}-03-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month4) {
      return `{${dayjs(`${year}-05-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month5) {
      return `{${dayjs(`${year}-06-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month7) {
      return `{${dayjs(`${year}-08-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month8) {
      return `{${dayjs(`${year}-09-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month10) {
      return `{${dayjs(`${year}-11-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month11) {
      return `{${dayjs(`${year}-12-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.quarter1) {
      return `{${dayjs(`${year}-04-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.quarter2) {
      return `{${dayjs(`${year}-07-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.quarter3) {
      return `{${dayjs(`${year}-10-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else {
      return `{${this.time2str(period.end_date)}}`
    }
  }

  async preProcess(id, entries, options, settings, columns): Promise<ReportLine[]> {
    const columnNames = columns.map((col) => col.name)

    // Summarize all totals from the entries.
    const totals = {}
    columnNames.forEach((column) => (totals[column] = {}))
    const accountNames = {}
    const accountNumbers = new Set<AccountNumber>()
    entries.forEach((entry) => {
      const column = 'period' + entry.periodId
      totals[column][entry.number] = totals[column][entry.number] || 0
      totals[column][entry.number] += entry.amount
      accountNames[entry.number] = entry.name
      accountNumbers.add(entry.number)
    })

    return this.parseAndCombineReport([...accountNumbers], accountNames, columns, options.format, totals)
  }

  /**
   * Mark mismatching Vastaavaa and Vastattavaa with red.
   */
  async postProcess(id, data) {
    const liabilities = data.find(line => line.name === 'Vastattavaa yhteensä')
    const assets = data.find(line => line.name === 'Vastaavaa yhteensä')
    if (liabilities && assets) {
      Object.values(liabilities.values).forEach((value, idx) => {
        if (Object.values(assets.values)[idx] !== value) {
          assets.error = true
          liabilities.error = true
        }
      })
    }

    return data
  }
}

export default EstonianBalanceSheetReport
