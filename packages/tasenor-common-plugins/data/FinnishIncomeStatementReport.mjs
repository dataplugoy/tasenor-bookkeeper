#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveText, trimCRLF } = commonNode.dataUtils

let tsv
tsv = trimCRLF(readFile('FinnishIncomeStatementReport - income-statement-fi.tsv'))
saveText('FinnishIncomeStatementReport', 'income-statement-fi.tsv', tsv)

tsv = trimCRLF(readFile('FinnishIncomeStatementReport - income-statement-detailed-fi.tsv'))
saveText('FinnishIncomeStatementReport', 'income-statement-detailed-fi.tsv', tsv)
