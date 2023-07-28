#!/usr/bin/env node
import { readFile, saveText, trimCRLF } from './lib/utils.mjs'

let tsv
tsv = trimCRLF(readFile('FinnishIncomeStatementReport - income-statement-fi.tsv'))
saveText('FinnishIncomeStatementReport', 'income-statement-fi.tsv', tsv)

tsv = trimCRLF(readFile('FinnishIncomeStatementReport - income-statement-detailed-fi.tsv'))
saveText('FinnishIncomeStatementReport', 'income-statement-detailed-fi.tsv', tsv)
