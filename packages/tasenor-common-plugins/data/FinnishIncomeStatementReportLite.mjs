#!/usr/bin/env node
import { readFile, saveText, trimCRLF } from './lib/utils.mjs'

let tsv

tsv = trimCRLF(readFile('FinnishIncomeStatementReportLite - income-statement-lite-fi.tsv'))
saveText('FinnishIncomeStatementReportLite', 'income-statement-lite-fi.tsv', tsv)
tsv = trimCRLF(readFile('FinnishIncomeStatementReportLite - income-statement-lite-en.tsv'))
saveText('FinnishIncomeStatementReportLite', 'income-statement-lite-en.tsv', tsv)