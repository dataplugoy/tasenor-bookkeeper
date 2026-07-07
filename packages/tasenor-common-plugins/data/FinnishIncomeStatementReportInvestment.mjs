#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { cleanFlagDuplicates, readFile, saveText, trimCRLF } = commonNode.dataUtils

let tsv
tsv = trimCRLF(readFile('FinnishIncomeStatementReportInvestment - income-statement-fi.tsv'))
tsv = cleanFlagDuplicates(tsv)
saveText('FinnishIncomeStatementReportInvestment', 'income-statement-investment-fi.tsv', tsv)

tsv = trimCRLF(readFile('FinnishIncomeStatementReportInvestment - income-statement-detailed-fi.tsv'))
tsv = cleanFlagDuplicates(tsv)
saveText('FinnishIncomeStatementReportInvestment', 'income-statement-investment-detailed-fi.tsv', tsv)
