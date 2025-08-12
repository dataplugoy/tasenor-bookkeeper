#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveText, trimCRLF } = commonNode.dataUtils

let tsv
tsv = trimCRLF(readFile('FinnishBalanceSheetReportSociety - balance-sheet-society-fi.tsv'))
saveText('FinnishBalanceSheetReportSociety', 'balance-sheet-society-fi.tsv', tsv)

tsv = trimCRLF(readFile('FinnishBalanceSheetReportSociety - balance-sheet-society-detailed-fi.tsv'))
saveText('FinnishBalanceSheetReportSociety', 'balance-sheet-society-detailed-fi.tsv', tsv)
