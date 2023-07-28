#!/usr/bin/env node
import { buildData, combine, insertToFile, lint, parseFile, rebuildTranslations, saveFile, saveJson, trimIndentation } from './lib/utils.mjs'

// Collect JSON data.
const all = combine(
  rebuildTranslations('IncomeAndExpenses', 'income', 'Income Tree - Definitions.tsv'),
  rebuildTranslations('IncomeAndExpenses', 'expense', 'Expense Tree - Definitions.tsv'),
  rebuildTranslations('IncomeAndExpenses', 'assets', 'Assets Tree - Definitions.tsv'),
  rebuildTranslations('IncomeAndExpenses', 'tax', 'Tax Types - Definitions.tsv')
)

// Save data file.
const income = buildData(parseFile('Income Tree - Definitions.tsv'))
saveJson('IncomeAndExpenses', 'income', income)
const expense = buildData(parseFile('Expense Tree - Definitions.tsv'))
saveJson('IncomeAndExpenses', 'expense', expense)
const assets = buildData(parseFile('Assets Tree - Definitions.tsv'))
saveJson('IncomeAndExpenses', 'assetCodes', assets)
const taxTypes = (parseFile('Tax Types - Definitions.tsv').map(line => line.id))
saveJson('IncomeAndExpenses', 'taxTypes', taxTypes)

// Write translations to plugin.
insertToFile(
  ['IncomeAndExpenses', 'backend', 'index.ts'],
  lint(trimIndentation(all, '      ')),
  '      // START TRANSLATION',
  '      // END TRANSLATION'
)

// Write income definition.
const incomes = Object.keys(income.parents).sort()
const commentsIn = incomes.map(code => ` * * \`${code}\` - ${all.en['income-' + code]}`)
const incomeFile =`/**
 * An income source.
 *
${commentsIn.join('\n')}
 */
export type IncomeSource = ${incomes.map(code => `'${code}'`).join(' |\n  ')}
`
saveFile('@tasenor-common', 'src/types/income.ts', incomeFile)

// Write expense definition.
const expenses = Object.keys(expense.parents).sort()
const commentsExp = expenses.map(code => ` * * \`${code}\` - ${all.en['expense-' + code]}`)
const expenseFile =`/**
 * A cause of expense.
 *
${commentsExp.join('\n')}
 */
export type ExpenseSink = ${expenses.map(code => `'${code}'`).join(' |\n  ')}
`
saveFile('@tasenor-common', 'src/types/expense.ts', expenseFile)

// Write assetType definition.
const assetCodes = Object.keys(assets.parents).sort()
const assetsExp = assetCodes.map(code => ` * * \`${code}\` - ${all.en['assets-' + code]}`)
const assetsFile =`/**
 * An asset type
 *
${assetsExp.join('\n')}
 */
export type AssetCode = ${assetCodes.map(code => `'${code}'`).join(' |\n  ')}
`
saveFile('@tasenor-common', 'src/types/assetCodes.ts', assetsFile)
