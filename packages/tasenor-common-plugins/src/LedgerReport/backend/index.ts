import { ReportPlugin } from '@tasenor/common-node'
import { Language, PluginCode, ReportColumnDefinition, ReportFormat, ReportID, ReportItem, ReportOptions, Version } from '@tasenor/common'

class LedgerReport extends ReportPlugin {
  constructor() {
    super('general-ledger' as ReportID)

    this.code = 'LedgerReport'as PluginCode
    this.title = 'Ledger Report'
    this.version = '1.0.13' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><path d="M0,0h24v24H0V0z" fill="none"/></g><g><g><path d="M14,5H5v14h14v-9h-5V5z M8,17c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S8.55,17,8,17z M8,13 c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S8.55,13,8,13z M8,9C7.45,9,7,8.55,7,8s0.45-1,1-1s1,0.45,1,1S8.55,9,8,9z" opacity=".3"/><circle cx="8" cy="8" r="1"/><path d="M15,3H5C3.9,3,3.01,3.9,3.01,5L3,19c0,1.1,0.89,2,1.99,2H19c1.1,0,2-0.9,2-2V9L15,3z M19,19H5V5h9v5h5V19z"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="16" r="1"/></g></g></svg>'
    this.releaseDate = '2022-03-05'
    this.use = 'backend'
    this.type = 'report'
    this.description = 'General purpose ledger report listing all entries in each account. Each account has also running total for balance.'

    this.languages = {
      en: {
        'report-general-ledger': 'General Ledger'
      },
      fi: {
        'report-general-ledger': 'Pääkirja'
      }
    }
  }

  forceOptions() {
    return {
      negateAssetAndProfit: false,
      addPreviousPeriod: false
    }
  }

  getLanguages(): Language[] {
    return ['fi', 'en']
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getReportStructure(id: ReportID, lang: Language) : ReportFormat | undefined {
    return '' as ReportFormat
  }

  getReportOptions(): ReportOptions {
    return {
      compact: 'boolean:true'
    }
  }

  async getColumns(): Promise<ReportColumnDefinition[]> {
    return [{
      type: 'id',
      name: 'account',
      title: '{column-account-number}'
    }, {
      type: 'name',
      name: 'name',
      title: '{column-name-or-date}'
    }, {
      type: 'numeric',
      name: 'debit',
      title: '{column-debit}'
    }, {
      type: 'numeric',
      name: 'credit',
      title: '{column-credit}'
    }, {
      type: 'numeric',
      name: 'balance',
      title: '{column-balance}'
    }]
  }

  preProcess(id, entries, options) {
    // Pre-process entries by their account number.
    const accounts = {}
    const accountNames = {}
    entries.forEach((entry) => {
      let data
      if (entry.number in accounts) {
        data = accounts[entry.number]
      } else {
        data = []
      }
      data.push({
        name: entry.name,
        number: entry.number,
        documentId: entry.documentId,
        description: entry.description,
        date: entry.date,
        amounts: {
          debit: entry.amount >= 0 ? entry.amount : null,
          credit: entry.amount < 0 ? -entry.amount : null,
          balance: null
        }
      })

      accounts[entry.number] = data
      accountNames[entry.number] = entry.name
    })

    const accountNumbers = Object.keys(accounts).sort()
    const data: ReportItem[] = []
    accountNumbers.forEach((number) => {
      const lines = accounts[number]
      data.push({
        tab: 0,
        bold: true,
        id: number,
        name: accountNames[number]
      })
      let total = 0
      lines.forEach((line) => {
        total += line.amounts.debit
        total -= line.amounts.credit
        line.amounts.balance = total
        if (options.compact) {
          data.push({
            tab: 0,
            needLocalization: true,
            id: `#${line.documentId}`,
            name: `{${this.time2str(line.date)}} ${line.description.replace(/^(\[.+?\])+\s*/g, '')}`,
            amounts: line.amounts
          })
        } else {
          data.push({
            tab: 0,
            needLocalization: true,
            id: `#${line.documentId}`,
            name: `{${this.time2str(line.date)}}`
          })
          data.push({
            tab: 0,
            useRemainingColumns: true,
            italic: true,
            name: `${line.description.replace(/^(\[.+?\])+\s*/g, '')}`
          })
          data.push({
            tab: 0,
            name: '',
            amounts: line.amounts
          })
        }
      })
      data.push({
        tab: 0,
        name: '',
        bold: true,
        bigger: true,
        amounts: {
          debit: '',
          credit: '',
          balance: total
        }
      })
    })

    return data
  }
}

export default LedgerReport
