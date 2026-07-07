#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { cleanFlagDuplicates, readFile, saveText, trimCRLF } = commonNode.dataUtils

let tsv
tsv = trimCRLF(readFile('FinnishBalanceSheetReportInvestment - balance-sheet-fi.tsv'))
tsv = cleanFlagDuplicates(tsv)
saveText('FinnishBalanceSheetReportInvestment', 'balance-sheet-investment-fi.tsv', tsv)

tsv = trimCRLF(readFile('FinnishBalanceSheetReportInvestment - balance-sheet-detailed-fi.tsv'))
tsv = cleanFlagDuplicates(tsv)
saveText('FinnishBalanceSheetReportInvestment', 'balance-sheet-investment-detailed-fi.tsv', tsv)
