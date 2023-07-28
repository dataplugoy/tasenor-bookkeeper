#!/usr/bin/env node
import { readFile, saveFile, trimCRLF } from './lib/utils.mjs'

let tsv
tsv = trimCRLF(readFile('FinnishLimitedCompanyLite - fi-EUR.tsv'))
saveFile('FinnishLimitedCompanyLite', 'backend/fi-EUR.tsv', tsv)

tsv = trimCRLF(readFile('FinnishLimitedCompanyLite - en-EUR.tsv'))
saveFile('FinnishLimitedCompanyLite', 'backend/en-EUR.tsv', tsv)
