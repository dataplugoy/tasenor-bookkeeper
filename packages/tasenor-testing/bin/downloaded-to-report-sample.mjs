#!/usr/bin/env -S npx tsx
/**
 * This tool converts downloaded report from UI to actual sample needed for
 * report test. It adds currencies and fixes some special notations shown on
 * the screen only.
 */
import fs from 'fs'
import { parse } from 'csv-parse/sync'

function convertCell(currency, decimal, thousand, cell) {
  // Mdash
  if (cell === '—') {
    return '–'
  }
  // Money
  if (/^\d+\.\d\d$/.test(cell)) {
    cell = cell.replace(/(\d+)(\d{3}\.\d\d)$/, `$1${thousand}$2`)
    return (cell + currency).replace('.', decimal)
  }
  return cell
}

function convert(currency, decimal, thousand, infile, outfile) {
  const data = fs.readFileSync(infile).toString('utf-8')
  const csv = parse(data)
  let out = ''
  for (let row = 0; row < csv.length; row++) {
    for (let col = 0; col < csv[row].length; col++) {
      const value = convertCell(currency, decimal, thousand, csv[row][col])
      if (value === '' && col === 0) {
        csv[row][col] = ''
      } else {
        csv[row][col] = '"' + value + '"'
      }
    }
    out += csv[row].join(',') + '\n'
  }
  fs.writeFileSync(outfile, out)
}

if (process.argv.length < 4) {
  console.log('usage:', process.argv[1], '<downloaded file> <report sample>')
  process.exit(1)
}

convert('€', ',', ' ', process.argv[2], process.argv[3])
