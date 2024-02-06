#!/usr/bin/env -S npx tsx
/**
 * Take CSV file name, key column number (1..n) and value column number and then build mapping from key to value JSON.
 */

import commonNode from '@tasenor/common-node'
const { loadCSVfile } = commonNode
import { argv } from 'process'

if (argv.length < 5) {
  console.log('usage: convert-csv-to-map.mjs <csv-file> <key-column> <value-column>')
  process.exit(1)
}

const csv = await loadCSVfile(argv[2])
const key = parseInt(argv[3]) - 1
const value = parseInt(argv[4]) - 1
const map = {}
let lineNumber = 1

for (const line of csv) {
  if (map[line[key]] !== undefined) {
    throw new Error(`Duplicate value ${JSON.stringify(line[key])} for key ${JSON.stringify(line[key])}. Already has ${JSON.stringify(map[line[key]])}.`)
  }
  if (lineNumber !== 1) {
    map[line[key]] = line[value]
  }
  lineNumber++
}

console.log(JSON.stringify(map, null, 2))
