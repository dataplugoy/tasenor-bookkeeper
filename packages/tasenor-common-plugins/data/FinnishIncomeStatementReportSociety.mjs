#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveText, trimCRLF } = commonNode.dataUtils

let tsv
tsv = trimCRLF(readFile('FinnishIncomeStatementReportSociety - income-statement-fi.tsv'))
saveText('FinnishIncomeStatementReportSociety', 'income-statement-society-fi.tsv', tsv)

tsv = trimCRLF(readFile('FinnishIncomeStatementReportSociety - income-statement-detailed-fi.tsv'))
saveText('FinnishIncomeStatementReportSociety', 'income-statement-society-detailed-fi.tsv', tsv)
