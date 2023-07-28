#!/usr/bin/env node
import { readFile, saveText, trimCRLF } from './lib/utils.mjs'

let tsv

tsv = trimCRLF(readFile('FinnishBalanceSheetReportLite - balance-sheet-lite-fi.tsv'))
saveText('FinnishBalanceSheetReportLite', 'balance-sheet-lite-fi.tsv', tsv)
tsv = trimCRLF(readFile('FinnishBalanceSheetReportLite - balance-sheet-lite-en.tsv'))
saveText('FinnishBalanceSheetReportLite', 'balance-sheet-lite-en.tsv', tsv)
