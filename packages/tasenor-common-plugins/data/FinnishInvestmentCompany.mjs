#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveFile, trimCRLF } = commonNode.dataUtils

const tsv = trimCRLF(readFile('FinnishInvestmentCompany - fi-EUR.tsv'))
saveFile('FinnishInvestmentCompany', 'backend/fi-EUR.tsv', tsv)
