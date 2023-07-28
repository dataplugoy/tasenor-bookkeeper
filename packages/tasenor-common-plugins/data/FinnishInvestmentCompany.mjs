#!/usr/bin/env node
import { readFile, saveFile, trimCRLF } from './lib/utils.mjs'

const tsv = trimCRLF(readFile('FinnishInvestmentCompany - fi-EUR.tsv'))
saveFile('FinnishInvestmentCompany', 'backend/fi-EUR.tsv', tsv)
