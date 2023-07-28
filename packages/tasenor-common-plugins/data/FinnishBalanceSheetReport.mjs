#!/usr/bin/env node
import { readFile, saveText, trimCRLF } from './lib/utils.mjs'

let tsv
tsv = trimCRLF(readFile('FinnishBalanceSheetReport - balance-sheet-fi.tsv'))
saveText('FinnishBalanceSheetReport', 'balance-sheet-fi.tsv', tsv)

tsv = trimCRLF(readFile('FinnishBalanceSheetReport - balance-sheet-detailed-fi.tsv'))
saveText('FinnishBalanceSheetReport', 'balance-sheet-detailed-fi.tsv', tsv)
