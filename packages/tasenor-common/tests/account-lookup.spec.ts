import { address2sql, PluginCode, AccountAddress, Knowledge, LinkedTree, AssetCode, ExpenseSink, IncomeSource, emptyLinkedTree } from '../src'

test('Convert account address to account default', async () => {
  const addr2sql = (addr: string, options: Record<string, string>) => address2sql(addr as AccountAddress, {
    defaultCurrency: 'EUR',
    plugin: 'SomeImport' as PluginCode,
    strict: true,
    ...options
  })

  expect(addr2sql('debt.currency.EUR', {})).toBe(
    "(data->>'code' = 'CREDITORS') AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL)"
  )
  expect(addr2sql('debt.currency.SEK', {})).toBe(
    "(data->>'code' = 'CREDITORS') AND (data->>'currency' = 'SEK') AND (data->>'plugin' = 'SomeImport')"
  )
  expect(addr2sql('debt.currency.USD', {})).toBe(
    "(data->>'code' = 'CREDITORS') AND (data->>'currency' = 'USD') AND (data->>'plugin' = 'SomeImport')"
  )
  expect(addr2sql('deposit.currency.EUR', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL) AND (type = 'ASSET')"
  )
  expect(addr2sql('deposit.external.EUR', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'plugin' != 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL) AND (type = 'ASSET')"
  )
  expect(addr2sql('distribution.currency.EUR', {})).toBe(
    null
  )
  expect(addr2sql('distribution.statement.LISTED_DIVIDEND', {})).toBe(
    null
  )
  expect(addr2sql('dividend.currency.EUR', {})).toBe(
    "(data->>'code' = 'DIVIDEND') AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL)"
  )
  expect(addr2sql('dividend.currency.SEK', {})).toBe(
    "(data->>'code' = 'DIVIDEND') AND (data->>'currency' = 'SEK') AND (data->>'plugin' = 'SomeImport')"
  )
  expect(addr2sql('dividend.currency.USD', {})).toBe(
    "(data->>'code' = 'DIVIDEND') AND (data->>'currency' = 'USD') AND (data->>'plugin' = 'SomeImport')"
  )
  expect(addr2sql('expense.currency.EUR', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL) AND (type = 'ASSET')"
  )
  expect(addr2sql('expense.statement.ADMIN', {})).toBe(
    "(data->>'code' = 'ADMIN') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.BANKING_FEE', {})).toBe(
    "(data->>'code' = 'BANKING_FEE') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.EQUIPMENT', {})).toBe(
    "(data->>'code' = 'EQUIPMENT') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.FURNITURE', {})).toBe(
    "(data->>'code' = 'FURNITURE') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.HARDWARE', {})).toBe(
    "(data->>'code' = 'HARDWARE') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.INFORMATION', {})).toBe(
    "(data->>'code' = 'INFORMATION') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.INTEREST_EXPENSE', {})).toBe(
    "(data->>'code' = 'INTEREST_EXPENSE') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.INTERNET', {})).toBe(
    "(data->>'code' = 'INTERNET') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.MEETINGS', {})).toBe(
    "(data->>'code' = 'MEETINGS') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.NEEDS_MANUAL_INSPECTION', {})).toBe(
    "(data->>'code' = 'NEEDS_MANUAL_INSPECTION') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.PHONE', {})).toBe(
    "(data->>'code' = 'PHONE') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.POSTAGE', {})).toBe(
    "(data->>'code' = 'POSTAGE') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.SOFTWARE', {})).toBe(
    "(data->>'code' = 'SOFTWARE') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.STOCK_BROKER_SERVICE_FEE', {})).toBe(
    "(data->>'code' = 'STOCK_BROKER_SERVICE_FEE') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.TICKET', {})).toBe(
    "(data->>'code' = 'TICKET') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('expense.statement.TRADE_LOSS_STOCK', {})).toBe(
    "(data->>'code' = 'TRADE_LOSS_STOCK') AND (type = 'EXPENSE')"
  )
  expect(addr2sql('fee.currency.EUR', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL) AND (type = 'ASSET')"
  )
  expect(addr2sql('forex.currency.EUR', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL)"
  )
  expect(addr2sql('forex.currency.SEK', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'currency' = 'SEK') AND (data->>'plugin' = 'SomeImport')"
  )
  expect(addr2sql('forex.currency.USD', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'currency' = 'USD') AND (data->>'plugin' = 'SomeImport')"
  )
  expect(addr2sql('income.currency.EUR', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL) AND (type = 'ASSET')"
  )
  expect(addr2sql('income.statement.FINLAND_SALES', {})).toBe(
    "(data->>'code' = 'FINLAND_SALES') AND (type = 'REVENUE')"
  )
  expect(addr2sql('income.statement.LISTED_DIVIDEND', {})).toBe(
    "(data->>'code' = 'LISTED_DIVIDEND') AND (type = 'REVENUE')"
  )
  expect(addr2sql('income.statement.TRADE_PROFIT_STOCK', {})).toBe(
    "(data->>'code' = 'TRADE_PROFIT_STOCK') AND (type = 'REVENUE')"
  )
  expect(addr2sql('investment.currency.EUR', {})).toBe(
    null
  )
  expect(addr2sql('investment.statement.NREQ', {})).toBe(
    "(data->>'code' = 'NREQ') AND (data->>'plugin' = 'SomeImport') AND (type = 'EQUITY')"
  )
  expect(addr2sql('tax.currency.EUR', {})).toBe(
    null
  )
  expect(addr2sql('tax.statement.CORPORATE_TAX', {})).toBe(
    "(data->>'code' = 'CORPORATE_TAX') AND (type = 'LIABILITY' OR type = 'ASSET')"
  )
  expect(addr2sql('tax.statement.NEEDS_MANUAL_INSPECTION', {})).toBe(
    "(data->>'code' = 'NEEDS_MANUAL_INSPECTION') AND (type = 'LIABILITY' OR type = 'ASSET')"
  )
  expect(addr2sql('tax.statement.PENALTY_OF_DELAY', {})).toBe(
    "(data->>'code' = 'PENALTY_OF_DELAY') AND (type = 'LIABILITY' OR type = 'ASSET')"
  )
  expect(addr2sql('tax.statement.TAX_AT_SOURCE', {})).toBe(
    "(data->>'code' = 'TAX_AT_SOURCE') AND (type = 'LIABILITY' OR type = 'ASSET')"
  )
  expect(addr2sql('tax.statement.VAT_DELAYED_PAYABLE', {})).toBe(
    "(data->>'code' = 'VAT_DELAYED_PAYABLE') AND (type = 'LIABILITY' OR type = 'ASSET')"
  )
  expect(addr2sql('tax.statement.VAT_FROM_PURCHASES', {})).toBe(
    "(data->>'code' = 'VAT_FROM_PURCHASES') AND (type = 'LIABILITY' OR type = 'ASSET')"
  )
  expect(addr2sql('tax.statement.VAT_FROM_SALES', {})).toBe(
    "(data->>'code' = 'VAT_FROM_SALES') AND (type = 'LIABILITY' OR type = 'ASSET')"
  )
  expect(addr2sql('tax.statement.VAT_RECEIVABLE', {})).toBe(
    "(data->>'code' = 'VAT_RECEIVABLE') AND (type = 'LIABILITY' OR type = 'ASSET')"
  )
  expect(addr2sql('tax.statement.WITHHOLDING_TAX', {})).toBe(
    "(data->>'code' = 'WITHHOLDING_TAX') AND (type = 'LIABILITY' OR type = 'ASSET')"
  )
  expect(addr2sql('trade.currency.EUR', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL) AND (type = 'ASSET')"
  )
  expect(addr2sql('trade.currency.USD', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'currency' = 'USD') AND (data->>'plugin' = 'SomeImport') AND (type = 'ASSET')"
  )
  expect(addr2sql('trade.stock.*', {})).toBe(
    "(data->>'code' = 'CURRENT_PUBLIC_STOCK_SHARES') AND (data->>'plugin' = 'SomeImport') AND (type = 'ASSET')"
  )
  expect(addr2sql('trade.crypto.*', {})).toBe(
    "(data->>'code' = 'CURRENT_CRYPTOCURRENCIES') AND (data->>'plugin' = 'SomeImport') AND (type = 'ASSET')"
  )
  expect(addr2sql('transfer.currency.EUR', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL) AND (type = 'ASSET')"
  )
  expect(addr2sql('transfer.external.Coinbase', {})).toBe(
    null
  )
  expect(addr2sql('transfer.external.Lynx', {})).toBe(
    null
  )
  expect(addr2sql('transfer.external.PayPal', {})).toBe(
    null
  )
  expect(addr2sql('transfer.external.NEEDS_MANUAL_INSPECTION', {})).toBe(
    "(data->>'code' = 'NEEDS_MANUAL_INSPECTION')"
  )
  expect(addr2sql('withdrawal.currency.EUR', {})).toBe(
    "(data->>'code' = 'CASH') AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'EUR' OR data->>'currency' IS NULL) AND (type = 'ASSET')"
  )
})

test('Use knowledge to have multiple codes matching', async () => {
  const assetCodes: LinkedTree<AssetCode> = {
    root: 'ASSETS',
    children: {
      ASSETS: [
        'CURRENT_ASSETS'
      ],
      CURRENT_ASSETS: [
        'CASH'
      ],
      CASH: [
        'CASH_IN_HAND',
        'CASH_AT_BANK',
        'CASH_AT_STOCK_BROKER',
        'CASH_AT_CRYPTO_BROKER',
        'CASH_AT_P2P'
      ]
    },
    parents: {
      ASSETS: null,
      CURRENT_ASSETS: 'ASSETS',
      CASH: 'CURRENT_ASSETS',
      CASH_IN_HAND: 'CASH',
      CASH_AT_BANK: 'CASH',
      CASH_AT_STOCK_BROKER: 'CASH',
      CASH_AT_CRYPTO_BROKER: 'CASH',
      CASH_AT_P2P: 'CASH'
    }
  }

  const K = new Knowledge({ assetCodes, vat: [], expense: emptyLinkedTree<ExpenseSink>(), income: emptyLinkedTree<IncomeSource>(), taxTypes: [] })

  const addr2sql = (addr: string, options: Record<string, string>) => address2sql(addr as AccountAddress, {
    defaultCurrency: 'USD',
    plugin: 'SomeImport' as PluginCode,
    strict: true,
    ...options
  }, K)

  expect(addr2sql('deposit.currency.USD', {})).toBe(
    "(data->>'code' IN ('CASH', 'CASH_IN_HAND', 'CASH_AT_BANK', 'CASH_AT_STOCK_BROKER', 'CASH_AT_CRYPTO_BROKER', 'CASH_AT_P2P')) AND (data->>'plugin' = 'SomeImport') AND (data->>'currency' = 'USD' OR data->>'currency' IS NULL) AND (type = 'ASSET')"
  )
})
