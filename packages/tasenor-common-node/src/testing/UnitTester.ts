import { AccountAddress, AccountNumber, AdditionalTransferInfo, AssetTransfer, StockValueData, Transaction, TransactionDescription, TransactionLine, ImportStateText, ImportConfig } from '@tasenor/common'
import { TransactionImportHandler, AskUI, Process } from '..'
import { getTestHandler } from './test-handlers'
import { SystemMock } from './ProcessingSystemMock'
import { sprintf } from 'sprintf-js'
import { UnitTestImportConnector } from './UnitTestImportConnector'

/**
 * Helper types to reduce type forcing in simple test data.
 */
export type AssetTransferTestData = Omit<Omit<AssetTransfer, 'asset'>, 'amount'> & { asset: string, amount?: number | undefined | null }

export type AdditionalTransferInfoTestData = Omit<AdditionalTransferInfo, 'stock'> & {
  stock?: {
    set?: Partial<Record<string, StockValueData>>
    change?: Partial<Record<string, StockValueData>>
  }
}

export type TransactionLineTestData = Omit<Omit<TransactionLine, 'data'>, 'account'> & {
  account: string
  data?: AdditionalTransferInfoTestData
}

/**
 * A container for setting up testing system.
 */
export class UnitTester {

  static accounts: string[] = [
    'deposit.external.EUR',
    'deposit.currency.EUR',
    'expense.statement.TRADE_LOSS_STOCK',
    'fee.currency.EUR',
    'fee.currency.USD',
    'income.statement.TRADE_PROFIT_CRYPTO',
    'income.statement.TRADE_PROFIT_SHORT',
    'trade.crypto.ETH',
    'trade.currency.EUR',
    'trade.currency.USD',
    'trade.short.NAKD',
    'trade.stock.NAKD',
  ]

  accountNumber: Record<string, string> = {}
  accountName: Record<string, string> = {}
  config: ImportConfig
  handler: TransactionImportHandler
  process: Process

  constructor(conf: Record<string, unknown> = {}) {
    this.config = {
      currency: 'EUR',
      language: 'en',
      isTradeFeePartOfTotal: false,
      allowShortSelling: false,
      recordDeposits: true,
      rules: []
    }
    Object.assign(this.config, conf)
    let number = 1000
    this.accountName = {}
    this.accountNumber = {}
    for (const name of UnitTester.accounts) {
      this.config[`account.${name}`] = `${number}`
      this.accountName[`${number}`] = name
      this.accountNumber[name] = `${number}`
      number += 10
    }
    this.handler = getTestHandler('Coinbase')
    this.handler.system = new SystemMock()
    this.process = new Process(this.handler.system, 'Unit test', this.config)
  }

  /**
   * Set the configuration value. Also add mapping if account.
   * @param name
   * @param value
   */
  set(name, value) {
    this.config[name] = value
    if (name.startsWith('account.')) {
      if (this.accountName[value]) {
        throw new Error(`Account number ${value} already exists. Please choose some other for ${name}.`)
      }
      this.accountName[value] = name.substr(8)
      this.accountNumber[name.substr(8)] = value
    }
  }

  /**
   * Add an answer to the answer collection.
   */
  answer(segment, name, value) {
    this.config.answers = this.config.answers || {}
    if (this.config.answers) {
      this.config.answers[segment] = this.config.answers[segment] || {};
      (this.config.answers[segment] as Record<string, unknown>)[name] = value
    }
  }

  /**
   * Get the account balance.
   * @param name
   */
  get(addr): number {
    const number = this.accountNumber[addr]
    if (!number) {
      throw new Error(`Invalid account name ${addr}.`)
    }
    return this.handler.getBalance(addr)
  }

  /**
   * Add to the initial balance.
   * @param accunt
   * @param amount
   */
  addMoney(account: string, amount: number) {
    if (!this.accountNumber[`${account}`]) {
      throw new Error(`Account ${account} not defined in UnitTester class.`)
    }
    (this.handler.system.connector as UnitTestImportConnector).addMoney(account as AccountAddress, this.accountNumber[`${account}`] as AccountNumber, amount)
  }

  /**
   * Construct a state for transfers.
   * @param transfers
   */
  makeState(transferSets: AssetTransfer[][]): ImportStateText<'classified'> {
    const state: ImportStateText<'classified'> = {
      stage: 'classified',
      files: {
        'test.csv': {
          lines: []
        }
      }
    }

    state.segments = {}
    state.result = {}

    for (let i = 0; i < transferSets.length; i++) {
      const id = `segment${i}`
      state.segments[id] = {
        id,
        time: new Date(`2022-01-01T00:00:${sprintf('%02d', i)}.000Z`),
        lines: []
      }
      state.result[id] = [{
        type: 'transfers',
        transfers: transferSets[i]
      }]
    }

    return state
  }

  /**
   * Execute one or more transfer analysis.
   * @param transfers
   * @param entries
   * @returns
   */
  async test(transfers: AssetTransferTestData[], entries: TransactionLineTestData[][],
    transfers2: AssetTransferTestData[] | undefined = undefined, entries2: TransactionLineTestData[][] | undefined = undefined,
    transfers3: AssetTransferTestData[] | undefined = undefined, entries3: TransactionLineTestData[][] | undefined = undefined,
    transfers4: AssetTransferTestData[] | undefined = undefined, entries4: TransactionLineTestData[][] | undefined = undefined,
    transfers5: AssetTransferTestData[] | undefined = undefined, entries5: TransactionLineTestData[][] | undefined = undefined
  ) {
    const transfersSets: AssetTransfer[][] = [transfers as AssetTransfer[]]
    const entriesSet: TransactionLine[][][] = [entries as TransactionLine[][]]
    if (transfers2) transfersSets.push(transfers2 as AssetTransfer[])
    if (transfers3) transfersSets.push(transfers3 as AssetTransfer[])
    if (transfers4) transfersSets.push(transfers4 as AssetTransfer[])
    if (transfers5) transfersSets.push(transfers5 as AssetTransfer[])
    if (entries2) entriesSet.push(entries2 as TransactionLine[][])
    if (entries3) entriesSet.push(entries3 as TransactionLine[][])
    if (entries4) entriesSet.push(entries4 as TransactionLine[][])
    if (entries5) entriesSet.push(entries5 as TransactionLine[][])

    const state = this.makeState(transfersSets)
    // Check just for compiler.
    if (!state.result || !state.segments) {
      return
    }

    let out
    try {
      out = await this.handler.analysis(this.process, state, [], this.config)
    } catch (err) {
      if (err instanceof AskUI) {
        console.log('\u001b[31mTest incomplete. Need more configuration.\u001b[0m')
        console.dir(err.element, { depth: null })
      }
      throw err
    }

    if (!out.result) {
      throw new Error(`Analyse failed to get results from ${JSON.stringify(state)}.`)
    }

    for (let i = 0; i < entriesSet.length; i++) {
      const id = `segment${i}`
      if (!out.result[id]) {
        throw new Error(`Analyse failed to get results from ${JSON.stringify(state)}.`)
      }
      // Convert accounts to symbolic to make test writing easier.
      for (const data of out.result[id] as TransactionDescription[]) {
        if (data.transactions) {
          for (const tx of data.transactions) {
            for (const entry of tx.entries) {
              if (this.accountName[entry.account]) {
                entry.account = this.accountName[entry.account] as AccountNumber
              }
            }
          }
        }
      }
      // Verify results.
      const result: Transaction[] = entriesSet[i].map(entries => ({
        date: new Date(`2022-01-01T00:00:${sprintf('%02d', i)}.000Z`),
        segmentId: id,
        entries
      }))

      const { expect } = await import('@jest/globals')
      expect(result).toStrictEqual(out.result[id][0].transactions)
    }
  }
}
