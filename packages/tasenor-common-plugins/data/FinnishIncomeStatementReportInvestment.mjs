#!/usr/bin/env node
import { cleanFlagDuplicates, readFile, saveText, trimCRLF } from './lib/utils.mjs'

let tsv
tsv = trimCRLF(readFile('FinnishIncomeStatementReportInvestment - income-statement-fi.tsv'))
tsv = cleanFlagDuplicates(tsv)
saveText('FinnishIncomeStatementReportInvestment', 'income-statement-investment-fi.tsv', tsv)

tsv = trimCRLF(readFile('FinnishIncomeStatementReportInvestment - income-statement-detailed-fi.tsv'))
tsv = cleanFlagDuplicates(tsv)
saveText('FinnishIncomeStatementReportInvestment', 'income-statement-investment-detailed-fi.tsv', tsv)
