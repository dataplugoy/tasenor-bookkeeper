import { AccountNumber, Language, PluginCode, ReportID, ReportOptions, Version } from '@tasenor/common'
import { ReportPlugin } from '@tasenor/common-node'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
dayjs.extend(quarterOfYear)

class FinnishIncomeStatementReportSociety extends ReportPlugin {

  constructor() {
    super('income-statement-society-detailed' as ReportID, 'income-statement-society' as ReportID)

    this.schemes = new Set(['FinnishSociety'])

    this.code = 'FinnishIncomeStatementReportSociety' as PluginCode
    this.title = 'Income Statement Report (Finnish - Society)'
    this.version = '1.0.0' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><path d="M0,0h24v24H0V0z" fill="none"/></g><g><g><path d="M14,5H5v14h14v-9h-5V5z M8,17c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S8.55,17,8,17z M8,13 c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S8.55,13,8,13z M8,9C7.45,9,7,8.55,7,8s0.45-1,1-1s1,0.45,1,1S8.55,9,8,9z" opacity=".3"/><circle cx="8" cy="8" r="1"/><path d="M15,3H5C3.9,3,3.01,3.9,3.01,5L3,19c0,1.1,0.89,2,1.99,2H19c1.1,0,2-0.9,2-2V9L15,3z M19,19H5V5h9v5h5V19z"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="16" r="1"/></g></g></svg>'
    this.releaseDate = '2025-11-27'
    this.use = 'backend'
    this.type = 'report'
    this.description = 'Income statement report for Finnish societies, i.e. rekisteröity yhdistys.'

    this.languages = {
      en: {
        'report-income-statement-society-detailed': 'Detailed income statement',
        'report-income-statement-society': 'Income statement'
      },
      fi: {
        'report-income-statement-society-detailed': 'Tuloslaskelma tilierittelyin',
        'report-income-statement-society': 'Tuloslaskelma'
      }
    }
  }

  forceOptions(options) {
    return {
      negateAssetAndProfit: true,
      addPreviousPeriod: !options.byTags
    }
  }

  getLanguages(): Language[] {
    return ['fi']
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
      byTags: 'boolean'
    }
  }

  /**
   * Construct column title for period.
   * @param formatName
   * @param period
   * @param settings
   */
  columnTitle(id, period, options) {
    const start = this.time2str(period.start_date)
    const year = dayjs(period.start_date).year()
    let end

    if (options.month1) {
      end = `{${dayjs(`${year}-02-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month2) {
      end = `{${dayjs(`${year}-03-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month4) {
      end = `{${dayjs(`${year}-05-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month5) {
      end = `{${dayjs(`${year}-06-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month7) {
      end = `{${dayjs(`${year}-08-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month8) {
      end = `{${dayjs(`${year}-09-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month10) {
      end = `{${dayjs(`${year}-11-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.month11) {
      end = `{${dayjs(`${year}-12-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.quarter1) {
      end = `{${dayjs(`${year}-04-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.quarter2) {
      end = `{${dayjs(`${year}-07-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else if (options.quarter3) {
      end = `{${dayjs(`${year}-10-01`).subtract(1, 'day').format('YYYY-MM-DD')}}`
    } else {
      end = `{${this.time2str(period.end_date)}}`
    }

    return '{' + start + '} — {' + end + '}'
  }

  async getColumns(id, entries, options, settings) {
    // Construct columns for each tag and extra column for non-tagged.
    if (options.byTags) {
      const columns = settings.tags.map((tag) => ({
        type: 'currency',
        name: `tag-${tag.tag}`,
        title: tag.name
      }))
      columns.push({
        type: 'currency',
        name: 'other',
        title: '{Other}'
      })
      columns.unshift({
        name: 'title',
        title: '',
        type: 'name'
      })
      return columns
    }

    return super.getColumns(id, entries, options, settings)
  }

  preProcessByTags(id, entries, options, settings, columns) {
    // Prepapre.
    const columnNames = columns.map((col) => col.name)
    const tagSet = new Set(settings.tags.map(t => t.tag))

    // Summarize all totals from the entries.
    const totals: Record<string, Record<string, number>> = {}
    columnNames.forEach((column) => (totals[column] = {}))
    const accountNames = {}
    const accountNumbers = new Set<AccountNumber>()
    const regex = /^((\[\w+\])+)/
    entries.forEach((entry) => {
      let shares: string[] = []
      const r = regex.exec(entry.description)
      if (r) {
        shares = r[1].substr(1, r[1].length - 2).split('][').filter(t => tagSet.has(t))
      }
      let amount = entry.amount
      if (shares.length) {
      // Share the amount so that rounding errors are split.
        const piece = amount < 0 ? Math.ceil(amount / shares.length) : Math.floor(amount / shares.length)
        shares.forEach((tag) => {
          const column = `tag-${tag}`
          totals[column][entry.number] = totals[column][entry.number] || 0
          totals[column][entry.number] += piece
          amount -= piece
        })
        if (amount) {
        // Make semi-random starting point and distribute cents.
          let i = (entry.periodId) % shares.length
          const delta = amount < 0 ? -1 : 1
          for (let count = Math.abs(amount); count > 0; count--) {
            const column = `tag-${shares[i]}`
            totals[column][entry.number] += delta
            amount -= delta
            i = (i + 1) % shares.length
          }
        }
      }

      if (amount) {
        totals.other[entry.number] = totals.other[entry.number] || 0
        totals.other[entry.number] += amount
      }

      accountNames[entry.number] = entry.name
      accountNumbers.add(entry.number)
    })

    return this.parseAndCombineReport([...accountNumbers], accountNames, columns, options.format, totals)
  }

  async preProcess(id, entries, options, settings, columns) {
    if (options.byTags) {
      return this.preProcessByTags(id, entries, options, settings, columns)
    }

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
   * Remove empty columns if report made by tags.
   */
  async postProcess(id, data, options, settings, columns) {
    if (!options.byTags) {
      return data
    }

    // Find empty columns.
    const found = new Set()
    for (const line of data) {
      if (!line.values) {
        continue
      }
      for (const [k, v] of Object.entries(line.values)) {
        if (v !== null && !isNaN(v as number)) {
          found.add(k)
        }
      }
    }

    // Remove empty columns.
    for (let i = 0; i < columns.length; i++) {
      if ((columns[i].type === 'currency' || columns[i].type === 'numeric') && !found.has(columns[i].name)) {
        columns.splice(i, 1)
        i--
      }
    }
    return data
  }
}

export default FinnishIncomeStatementReportSociety
