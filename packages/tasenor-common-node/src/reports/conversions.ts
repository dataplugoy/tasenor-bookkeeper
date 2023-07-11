import { ReportQueryParams } from '@dataplug/tasenor-common'
import json2csv from 'json2csv'
import { sprintf } from 'sprintf-js'

/**
 * Convert report to CSV format.
 * @param {Object} report
 * @param {Object} options
 * @param {String} options.lang Localize number using this language.
 */
export function data2csv(report, options: ReportQueryParams) {
  const csv: Record<string, string>[] = []

  const render = {
    id: (column, entry) => entry.id,
    name: (column, entry) => `${entry.isAccount ? entry.number + ' ' : ''}${entry.name}`,
    text: (column, entry) => entry[column.name],
    numeric: (column, entry) => (entry.amounts &&
      !entry.hideTotal &&
      entry.amounts[column.name] !== '' &&
      !isNaN(entry.amounts[column.name]) &&
      entry.amounts[column.name] !== undefined)
      ? (entry.amounts[column.name] === null ? '—' : sprintf('%.2f', entry.amounts[column.name] / 100))
      : ''
  }

  const { data, columns } = report
  let line: Record<string, string> = {}
  if (!options.dropTitle) {
    columns.forEach((column) => (line[column.name] = column.title))
    csv.push(line)
  }

  data.forEach((entry) => {
    if (entry.paragraphBreak) {
      return
    }
    line = {}
    columns.forEach((column) => {
      if (entry.pageBreak || entry.paragraphBreak) {
        line[column.name] = ''
      } else {
        line[column.name] = render[column.type](column, entry)
      }
    })
    csv.push(line)
  })

  const fields = columns.map((c) => c.name)

  return json2csv.parse(csv, { fields, header: false })
}
