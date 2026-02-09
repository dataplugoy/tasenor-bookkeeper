#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveText, trimCRLF } = commonNode.dataUtils

let tsv
tsv = trimCRLF(readFile('EstonianIncomeStatementReport - income-statement-fi.tsv'))
saveText('EstonianIncomeStatementReport', 'income-statement-fi.tsv', tsv)
tsv = trimCRLF(readFile('EstonianIncomeStatementReport - income-statement-en.tsv'))
saveText('EstonianIncomeStatementReport', 'income-statement-en.tsv', tsv)

tsv = trimCRLF(readFile('EstonianIncomeStatementReport - income-statement-detailed-fi.tsv'))
saveText('EstonianIncomeStatementReport', 'income-statement-detailed-fi.tsv', tsv)
tsv = trimCRLF(readFile('EstonianIncomeStatementReport - income-statement-detailed-en.tsv'))
saveText('EstonianIncomeStatementReport', 'income-statement-detailed-en.tsv', tsv)
