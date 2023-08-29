#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveText, trimCRLF } = commonNode.dataUtils

let tsv

tsv = trimCRLF(readFile('FinnishBalanceSheetReportLite - balance-sheet-lite-fi.tsv'))
saveText('FinnishBalanceSheetReportLite', 'balance-sheet-lite-fi.tsv', tsv)
tsv = trimCRLF(readFile('FinnishBalanceSheetReportLite - balance-sheet-lite-en.tsv'))
saveText('FinnishBalanceSheetReportLite', 'balance-sheet-lite-en.tsv', tsv)
