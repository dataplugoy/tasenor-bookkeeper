#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveFile, trimCRLF } = commonNode.dataUtils

let tsv
tsv = trimCRLF(readFile('FinnishLimitedCompanyLite - fi-EUR.tsv'))
saveFile('FinnishLimitedCompanyLite', 'backend/fi-EUR.tsv', tsv)

tsv = trimCRLF(readFile('FinnishLimitedCompanyLite - en-EUR.tsv'))
saveFile('FinnishLimitedCompanyLite', 'backend/en-EUR.tsv', tsv)
