#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveText, trimCRLF } = commonNode.dataUtils

let tsv

tsv = trimCRLF(readFile('FinnishIncomeStatementReportLite - income-statement-lite-fi.tsv'))
saveText('FinnishIncomeStatementReportLite', 'income-statement-lite-fi.tsv', tsv)
tsv = trimCRLF(readFile('FinnishIncomeStatementReportLite - income-statement-lite-en.tsv'))
saveText('FinnishIncomeStatementReportLite', 'income-statement-lite-en.tsv', tsv)
