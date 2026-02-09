#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { readFile, saveText, trimCRLF } = commonNode.dataUtils

let tsv = trimCRLF(readFile('EstonianBalanceSheetReport - balance-sheet-fi.tsv'))
saveText('EstonianBalanceSheetReport', 'balance-sheet-fi.tsv', tsv)
tsv = trimCRLF(readFile('EstonianBalanceSheetReport - balance-sheet-en.tsv'))
saveText('EstonianBalanceSheetReport', 'balance-sheet-en.tsv', tsv)

tsv = trimCRLF(readFile('EstonianBalanceSheetReport - balance-sheet-detailed-fi.tsv'))
saveText('EstonianBalanceSheetReport', 'balance-sheet-detailed-fi.tsv', tsv)
tsv = trimCRLF(readFile('EstonianBalanceSheetReport - balance-sheet-detailed-en.tsv'))
saveText('EstonianBalanceSheetReport', 'balance-sheet-detailed-en.tsv', tsv)
