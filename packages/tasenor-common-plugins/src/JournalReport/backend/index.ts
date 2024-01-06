import { ReportPlugin } from '@tasenor/common-node'
import { Language, PluginCode, ReportColumnDefinition, ReportFormat, ReportID, ReportItem, ReportOptions, Version } from '@tasenor/common'

class JournalReport extends ReportPlugin {
  constructor() {
    super('general-journal' as ReportID)

    this.code = 'JournalReport' as PluginCode
    this.title = 'Journal Report'
    this.version = '1.0.11' as Version
    this.icon = '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><path d="M0,0h24v24H0V0z" fill="none"/></g><g><g><path d="M14,5H5v14h14v-9h-5V5z M8,17c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S8.55,17,8,17z M8,13 c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S8.55,13,8,13z M8,9C7.45,9,7,8.55,7,8s0.45-1,1-1s1,0.45,1,1S8.55,9,8,9z" opacity=".3"/><circle cx="8" cy="8" r="1"/><path d="M15,3H5C3.9,3,3.01,3.9,3.01,5L3,19c0,1.1,0.89,2,1.99,2H19c1.1,0,2-0.9,2-2V9L15,3z M19,19H5V5h9v5h5V19z"/><circle cx="8" cy="12" r="1"/><circle cx="8" cy="16" r="1"/></g></g></svg>'
    this.releaseDate = '2022-03-05'
    this.use = 'backend'
    this.type = 'report'
    this.description = 'General purpose journal report listing all entries in chornological order.'

    this.languages = {
      en: {
        'report-general-journal': 'General Journal'
      },
      fi: {
        'report-general-journal': 'Päiväkirja'
      }
    }
  }

  getLanguages(): Language[] {
    return ['fi', 'en']
  }

  forceOptions() {
    return {
      negateAssetAndProfit: false,
      addPreviousPeriod: false
    }
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
      name: 'id',
      title: '{column-document-number}'
    }, {
      type: 'name',
      name: 'title',
      title: '{column-date-and-accounts}'
    }, {
      type: 'currency',
      name: 'debit',
      title: '{column-debit}'
    }, {
      type: 'currency',
      name: 'credit',
      title: '{column-credit}'
    }]
  }

  preProcess(id, entries, options) {
    // Pre-process entries by their document number.
    const docs = {}
    entries.forEach((entry) => {
      let data
      if (entry.documentId in docs) {
        data = docs[entry.documentId]
      } else {
        data = []
      }
      data.push({
        name: entry.name,
        number: entry.number,
        description: entry.description,
        date: entry.date,
        values: {
          debit: entry.amount >= 0 ? entry.amount : null,
          credit: entry.amount < 0 ? -entry.amount : null
        }
      })
      docs[entry.documentId] = data
    })

    // Helper to construct a list of descriptions.
    const descriptions = (lines) => {
      const textSet = new Set<string>()
      const accountNumbers = {}

      lines.forEach((line) => {
        const text = line.description.replace(/^(\[.+?\])+\s*/, '')
        if (text !== '') {
          textSet.add(text)
          accountNumbers[text] = accountNumbers[text] || new Set()
          accountNumbers[text].add(line.number)
        }
      })

      const texts: string[] = [...textSet]
      if (texts.length === 1) {
        return texts
      }

      return texts.map((text) => text + ' [' + Array.from(accountNumbers[text]).join(', ') + ']')
    }

    // Construct lines for each document.
    const docIds = Object.keys(docs).sort((a, b) => parseInt(a) - parseInt(b))
    const data: ReportItem[] = []
    docIds.forEach((docId) => {
      const lines = docs[docId]
      data.push({
        tab: 0,
        bold: true,
        id: `#${docId}`,
        needLocalization: true,
        name: `{${this.time2str(lines[0].date)}}`
      })
      if (!options.compact) {
        descriptions(lines).forEach((text) => {
          data.push({
            tab: 2,
            name: text,
            fullWidth: true,
            italic: true
          })
        })
      }
      lines.forEach((line) => {
        if (options.compact) {
          data.push({
            tab: 0,
            name: `${line.number} ${line.name}: ${line.description}`,
            values: line.values
          })
        } else {
          data.push({
            tab: 2,
            name: `${line.number} ${line.name}`,
            values: line.values
          })
        }
      })
    })

    return data
  }
}

export default JournalReport
