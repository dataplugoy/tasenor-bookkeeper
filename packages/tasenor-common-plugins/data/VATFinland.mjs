#!/usr/bin/env node
import { trimId, readTsv, fixNumber, saveJson } from './lib/utils.mjs'

const data = []
const tsv = readTsv('Finland VAT - Definitions.tsv', true)

for (let column = 1; column < tsv[0].length; column++) {
  const from = tsv[0][column]
  const to = tsv[1][column] || null

  const percentage = {}
  for (let line = 2; line < tsv.length; line ++) {
    const id = trimId(tsv[line][0])
    const value = tsv[line][column]
    if (value !== undefined) {
      percentage[id] = fixNumber(value.replace(',', '.'))
    }
  }
  data.push({ from, to, percentage })
}

saveJson('VATFinland', 'vat', data)
