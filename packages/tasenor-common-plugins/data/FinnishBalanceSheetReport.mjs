#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveText, trimCRLF } = commonNode.dataUtils

let tsv
tsv = trimCRLF(readFile('FinnishBalanceSheetReport - balance-sheet-fi.tsv'))
saveText('FinnishBalanceSheetReport', 'balance-sheet-fi.tsv', tsv)

tsv = trimCRLF(readFile('FinnishBalanceSheetReport - balance-sheet-detailed-fi.tsv'))
saveText('FinnishBalanceSheetReport', 'balance-sheet-detailed-fi.tsv', tsv)
