#!/usr/bin/env node
import { cleanFlagDuplicates, readFile, saveText, trimCRLF } from './lib/utils.mjs'

let tsv
tsv = trimCRLF(readFile('FinnishBalanceSheetReportInvestment - balance-sheet-fi.tsv'))
tsv = cleanFlagDuplicates(tsv)
saveText('FinnishBalanceSheetReportInvestment', 'balance-sheet-investment-fi.tsv', tsv)

tsv = trimCRLF(readFile('FinnishBalanceSheetReportInvestment - balance-sheet-detailed-fi.tsv'))
tsv = cleanFlagDuplicates(tsv)
saveText('FinnishBalanceSheetReportInvestment', 'balance-sheet-investment-detailed-fi.tsv', tsv)
