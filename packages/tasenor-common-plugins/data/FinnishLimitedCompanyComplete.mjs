#!/usr/bin/env node
import { readFile, saveFile, trimCRLF } from './lib/utils.mjs'

const tsv = trimCRLF(readFile('FinnishLimitedCompanyComplete - fi-EUR.tsv'))
saveFile('FinnishLimitedCompanyComplete', 'backend/fi-EUR.tsv', tsv)
