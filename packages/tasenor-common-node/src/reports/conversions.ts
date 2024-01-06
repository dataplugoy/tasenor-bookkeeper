import { ReportQueryParams } from '@tasenor/common'
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
    name: (column, entry) => entry.name === undefined ? '' : `${entry.isAccount ? entry.number + ' ' : ''}${entry.name}`,
    text: (column, entry) => entry[column.name],
    // TODO: Here and rendering we could use heuristic string rounding, i.e. get rid of ..3999999 -> ..4
    //       Need to share function with rendering.
    numeric: (column, entry) => (entry.values &&
      !entry.hideTotal &&
      entry.values[column.name] !== '' &&
      !isNaN(entry.values[column.name]) &&
      entry.values[column.name] !== undefined)
      ? (entry.values[column.name] === null ? '—' : sprintf('%f', entry.values[column.name]))
      : '',
    currency: (column, entry) => (entry.values &&
      !entry.hideTotal &&
      entry.values[column.name] !== '' &&
      !isNaN(entry.values[column.name]) &&
      entry.values[column.name] !== undefined)
      ? (entry.values[column.name] === null ? '—' : sprintf('%.2f', entry.values[column.name] / 100))
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
