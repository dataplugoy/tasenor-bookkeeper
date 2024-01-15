/* eslint-disable @typescript-eslint/no-unused-vars */
import { ReportColumnDefinition, ReportItem } from '@tasenor/common'
import { ReportPlugin } from '@tasenor/common-node'
import dayjs from 'dayjs'

// TODO: Not used?

/**
 * Report of account transactions on the given period.
 */
export class AccountReport extends ReportPlugin {

  async getColumns(id, entries, options, settings): Promise<ReportColumnDefinition[]> {
    // TODO: Translations should be actually in this plugin and not in general translation file.
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
      type: 'currency',
      name: 'debit',
      title: '{column-debit}'
    }, {
      type: 'currency',
      name: 'credit',
      title: '{column-credit}'
    }, {
      type: 'currency',
      name: 'balance',
      title: '{column-balance}'
    }]
  }

  async preProcess(id, entries, options, settings, columns) {
    const data: Record<string, unknown>[] = []
    let total = 0
    entries.forEach((entry) => {
      total += entry.amount
      data.push({
        id: entry.documentId,
        description: entry.description,
        date: dayjs(entry.date).format('YYYY-MM-DD'),
        values: {
          debit: entry.amount >= 0 ? entry.amount : null,
          credit: entry.amount < 0 ? -entry.amount : null,
          balance: total
        }
      })
    })
    return data
  }
}
