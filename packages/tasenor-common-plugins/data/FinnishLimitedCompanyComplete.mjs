#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveFile, trimCRLF } = commonNode.dataUtils

const tsv = trimCRLF(readFile('FinnishLimitedCompanyComplete - fi-EUR.tsv'))
saveFile('FinnishLimitedCompanyComplete', 'backend/fi-EUR.tsv', tsv)
