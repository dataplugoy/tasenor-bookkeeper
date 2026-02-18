#!/usr/bin/env node
/**
 * Convert dataplug-legacy source CSVs to Cypress fixture format.
 *
 * Reads raw report CSVs from the dataplug-legacy/src/ directory and writes
 * transformed versions to e2e/cypress/fixtures/dataplug/.
 *
 * Transformation rules (matching the old create-test-from-csv.js):
 *   "" (empty)        → "" (stays empty)
 *   "—" (em-dash)     → "–" (en-dash, matches app rendering)
 *   "{YYYY-MM-DD}"    → "DD.MM.YYYY"
 *   "{Other}"         → "Muu"
 *   "15692,32"        → "15 692,32€"
 *   "-4"              → "-4,00€"
 */
const fs = require('fs')
const path = require('path')

const SRC_DIR = path.resolve(__dirname, '..', '..', '..', 'tests', 'dataplug-legacy', 'src')
const OUT_DIR = path.resolve(__dirname, '..', 'cypress', 'fixtures', 'dataplug')

function processCell(content) {
  if (content === '') return ''
  if (content === '\u2014') return '\u2013' // em-dash → en-dash
  if (content === '-') return '\u2013' // plain hyphen → en-dash (some CSVs use this)
  if (content === '{Other}') return 'Muu'

  const dateMatch = /^\{(\d{4})-(\d{2})-(\d{2})\}$/.exec(content)
  if (dateMatch) {
    return `${dateMatch[3]}.${dateMatch[2]}.${dateMatch[1]}`
  }

  const numMatch = /^-?\d+(,\d+)?$/.exec(content)
  if (numMatch) {
    const parts = content.replace(',', '.').split('.')
    const intPart = parseInt(parts[0], 10)
    const decPart = parts[1] ? parseFloat('0.' + parts[1]) : 0
    const absInt = Math.abs(intPart)
    const sign = intPart < 0 || (intPart === 0 && content.startsWith('-')) ? '-' : ''

    let intStr = absInt.toString()
    // Insert regular space as thousands separator (matches app rendering)
    intStr = intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

    const total = (intPart + (intPart < 0 ? -decPart : decPart))
    const decStr = Math.abs(total).toFixed(2).split('.')[1]

    return `${sign}${intStr},${decStr}\u20ac`
  }

  return content
}

function parseCSV(text) {
  const rows = []
  let current = ''
  let inQuotes = false
  let row = []

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(current)
        current = ''
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i++
        }
        row.push(current)
        current = ''
        if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
          rows.push(row)
        }
        row = []
      } else {
        current += ch
      }
    }
  }
  // Last row
  row.push(current)
  if (row.length > 0 && !(row.length === 1 && row[0] === '')) {
    rows.push(row)
  }

  return rows
}

function toCSV(rows) {
  return rows.map(row =>
    row.map(cell => {
      if (cell === '') return '""'
      // Always quote non-empty cells
      return '"' + cell.replace(/"/g, '""') + '"'
    }).join(',')
  ).join('\n') + '\n'
}

// Find all source CSV files
const files = fs.readdirSync(SRC_DIR).filter(f =>
  /^\d{4}-q\d-(balance-sheet-detailed|income-statement-detailed)\.csv$/.test(f)
)

console.log(`Found ${files.length} source CSV files in ${SRC_DIR}`)

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

for (const file of files.sort()) {
  const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf-8')
  const rows = parseCSV(content)

  // Transform each cell
  const transformed = rows.map(row => row.map(cell => processCell(cell)))

  const output = toCSV(transformed)
  const outPath = path.join(OUT_DIR, file)
  fs.writeFileSync(outPath, output, 'utf-8')
  console.log(`  ${file} → ${transformed.length} rows`)
}

console.log(`\nDone. Wrote ${files.length} fixtures to ${OUT_DIR}`)
