import { ReportColumnDefinition } from '@dataplug/tasenor-common'
const { ReportPlugin } = require('@dataplug/tasenor-common-node')
const dayjs = require('dayjs')

/**
 * Report of account transactions on the given period.
 */
export class AccountReport extends ReportPlugin {

  async getColumns(id, entries, options, settings): Promise<ReportColumnDefinition[]> {
    return [{
      type: 'id',
      name: 'id',
      title: '{column-document-number}'
    }, {
      type: 'text',
      name: 'date',
      title: '{column-date}'
    }, {
      type: 'text',
      name: 'description',
      title: '{column-description}'
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

  preProcess(id, entries, options, settings, columns) {
    const data = []
    let total = 0
    entries.forEach((entry) => {
      total += entry.amount
      data.push({
        id: entry.documentId,
        description: entry.description,
        date: dayjs(entry.date).format('YYYY-MM-DD'),
        amounts: {
          debit: entry.amount >= 0 ? entry.amount : null,
          credit: entry.amount < 0 ? -entry.amount : null,
          balance: total
        }
      })
    })
    return data
  }
}
