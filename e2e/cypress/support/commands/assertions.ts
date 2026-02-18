/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
/// <reference types=".." />
import { parse } from 'csv-parse/sync'

export {}

/**
 * Find a table row and cell and check if text content is the defined.
 */
chai.Assertion.addChainableMethod('cellEquals', function(row: number, col: number, text: string) {
  const cell = this._obj.find('tr').eq(row).find('td').eq(col)
  expect(cell.text()).to.eq(text)
})

/**
 * Compare CSV report to the report found from the screen.
 * heading2 can be a string (exact match) or RegExp (pattern match).
 */
chai.Assertion.addChainableMethod('matchReport', function(heading1: string, heading2: string | RegExp, report: string) {
  const file = parse(report)

  // Check headings.
  if (this._obj[0].join(' ') !== heading1) {
    throw new Error(`First heading of the report '${this._obj[0].join(' ')}' does not match expected '${heading1}'.`)
  }
  const h2 = this._obj[1].join(' ')
  if (heading2 instanceof RegExp) {
    if (!heading2.test(h2)) {
      throw new Error(`Second heading of the report '${h2}' does not match pattern '${heading2}'.`)
    }
  } else if (h2 !== heading2) {
    throw new Error(`Second heading of the report '${h2}' does not match expected '${heading2}'.`)
  }

  const remaining = this._obj.slice(2)

  // Compare reports.
  let diff: null | number = null
  for (let n = 0; n < Math.max(remaining.length, file.length); n++) {
    const original = file[n] || []
    const current = remaining[n] || []
    if (original.length !== current.length) {
      diff = n + 1
      break
    } else {
      for (let i = 0; i < original.length; i++) {
        if (original[i] !== current[i]) {
          diff = n + 1
          break
        }
      }
    }
    if (diff !== null) break
  }

  expect(diff, `Report line #${diff} ${JSON.stringify(remaining[diff  as number - 1])} does not match to ${JSON.stringify(file[diff as number - 1])}.`).to.be.null
})
