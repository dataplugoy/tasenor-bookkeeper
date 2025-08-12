#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveFile, trimCRLF } = commonNode.dataUtils

const tsv = trimCRLF(readFile('FinnishSociety - fi-EUR.tsv'))
saveFile('FinnishSociety', 'backend/fi-EUR.tsv', tsv)
