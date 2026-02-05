#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveFile, trimCRLF } = commonNode.dataUtils

const tsv = trimCRLF(readFile('EstonianLimitedCompanyLite - fi-EUR.tsv'))
saveFile('EstonianLimitedCompanyLite', 'backend/fi-EUR.tsv', tsv)
