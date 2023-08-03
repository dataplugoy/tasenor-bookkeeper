/* eslint-disable @typescript-eslint/no-unused-vars */
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import dayjs from 'dayjs'
import { encode } from 'base64-arraybuffer'
import { sprintf } from 'sprintf-js'
import clone from 'clone'
import deepEqual from 'deep-equal'

import { elementNames, ImportState, AccountNumber, TradeableAsset, StockValueData, Transaction, AssetType, Asset, AssetExchange, Currency, TransactionDescription, sortTransactions, AssetTransfer, Language, Knowledge, VATTarget, error, isCurrency, BalanceBookkeeping, ZERO_STOCK, ZERO_CENTS, Directions, ID } from '@tasenor/common'
import { ISPDemoServer, ProcessHandler, TransactionImportHandler, TransactionImportConnector, ImportPlugin, getTestHandler, getTestHandlerPath } from '@tasenor/common-node'
// TODO: Accessing directly should be handled other way.
import { CoinbaseHandler } from '../../tasenor-common-plugins/src/CoinbaseImport/backend/CoinbaseHandler'
import IncomeAndExpenses from '../../tasenor-common-plugins/src/IncomeAndExpenses/backend'
import { getTestCryptoRate, getTestCurrencyRate } from './services'

const PORT = 4567
const DATABASE_URL: string = process.env.DATABASE_URL || 'postgres://user:pass@localhost/test'

class TestFailure extends Error {}

/**
 * A class for testing importing. This instance also works as connector to the import handling.
 */
export class TestImportConnector implements TransactionImportConnector {

  static baseDir: string = path.join(__dirname, '..', '..')

  static handlerDirs: Record<string, string> = {
    // TODO: Accessing directly should be handled other way.
    Coinbase: path.join(TestImportConnector.baseDir, 'src', 'CoinbaseImport', 'backend'),
    Nordea: path.join(TestImportConnector.baseDir, 'src', 'NordeaImport', 'backend'),
    Nordnet: path.join(TestImportConnector.baseDir, 'src', 'NordnetImport', 'backend'),
    Lynx: path.join(TestImportConnector.baseDir, 'src', 'LynxImport', 'backend'),
    TITO: path.join(TestImportConnector.baseDir, 'src', 'TITOImport', 'backend'),
  }

  config: Record<string, unknown>
  server: ISPDemoServer
  moduleDir: string
  testDir: string
  testFilePath: string
  handler: TransactionImportHandler
  result: ImportState
  watch: boolean
  uiCount: number
  knowledge: Knowledge
  stock: Record<string, unknown> | null

  constructor(testFile: string, handler: string, watch: boolean) {
    this.stock = null
    this.watch = watch

    this.testFilePath = path.normalize(path.join(__dirname, '..', testFile))
    this.testDir = path.dirname(this.testFilePath)
    this.handler = getTestHandler(handler)
    this.moduleDir = path.join(TestImportConnector.baseDir, getTestHandlerPath(handler))
    this.config = JSON.parse(fs.readFileSync(`${this.testDir}/settings.json`).toString('utf-8'))

    const rules = JSON.parse(fs.readFileSync(`${this.moduleDir}/rules.json`).toString('utf-8')).rules
    if (fs.existsSync(`${this.testDir}/rules.json`)) {
      const ruleContent = JSON.parse(fs.readFileSync(`${this.testDir}/rules.json`).toString('utf-8'))
      this.config.rules = rules.concat(ruleContent.rules)
    } else {
      this.config.rules = rules
    }

    if (fs.existsSync(`${this.testDir}/questions.json`)) {
      const questions = JSON.parse(fs.readFileSync(`${this.testDir}/questions.json`).toString('utf-8'))
      this.config.questions = questions.questions
    }

    if (fs.existsSync(`${this.testDir}/answers.json`)) {
      const answers = JSON.parse(fs.readFileSync(`${this.testDir}/answers.json`).toString('utf-8'))
      this.config.answers = answers
    }

    this.uiCount = 0

    // Create knowledge base.
    // TODO: Accessing directly should be handled other way.
    const vat = JSON.parse(fs.readFileSync(`${this.testDir}/../../../../src/VATFinland/backend/vat.json`).toString('utf-8'))
    const income = JSON.parse(fs.readFileSync(`${this.testDir}/../../../../src/IncomeAndExpenses/backend/income.json`).toString('utf-8'))
    const expense = JSON.parse(fs.readFileSync(`${this.testDir}/../../../../src/IncomeAndExpenses/backend/expense.json`).toString('utf-8'))
    const assetCodes = JSON.parse(fs.readFileSync(`${this.testDir}/../../../../src/IncomeAndExpenses/backend/assetCodes.json`).toString('utf-8'))
    const taxTypes = JSON.parse(fs.readFileSync(`${this.testDir}/../../../../src/IncomeAndExpenses/backend/taxTypes.json`).toString('utf-8'))

    this.knowledge = new Knowledge({ income, expense, vat, taxTypes, assetCodes })
  }

  async initialize(server: ISPDemoServer) {
    this.server = server
    const content = fs.readFileSync(this.testFilePath)
    const files = [
      {
        name: this.testFilePath,
        type: 'text/csv',
        encoding: 'base64',
        data: encode(content)
      }
    ]
    await axios.post(`http://localhost:${PORT}/api/isp`, { files, config: this.config })
  }

  async getAccountCanditates(): Promise<AccountNumber[]> {
    return []
  }

  /**
   * Assume that we want only initial balances and read them from the file.
   */
  async initializeBalances(time: Date, balances: BalanceBookkeeping): Promise<void> {
    const initialPath = `${this.testDir}/balance.json`
    const balance = fs.existsSync(initialPath) ? JSON.parse(fs.readFileSync(initialPath).toString('utf-8')) : {}
    const settingPath = `${this.testDir}/settings.json`
    const settings = fs.existsSync(settingPath) ? JSON.parse(fs.readFileSync(settingPath).toString('utf-8')) : {}
    balances.configureNames(settings)
    Object.keys(settings).forEach(name => {
      if (name.startsWith('account.')) {
        if (balance[settings[name]] !== undefined) {
          balances.set(settings[name] as AccountNumber, balance[settings[name]])
        }
      }
    })
  }

  /**
   * Use import plugin instance to translate.
   * @param text
   * @param language
   * @returns
   */
  async getTranslation(text: string, language: string): Promise<string> {
    const plugin = new ImportPlugin(new CoinbaseHandler() as unknown as TransactionImportHandler)
    const ret = plugin.t(text, language as Language)
    if (ret !== text) {
      return ret
    }
    const IEplugin = new IncomeAndExpenses()
    return IEplugin.t(text, language as Language)
  }

  /**
   * Implement stock by reading values from stock.json file.
   * @param time
   * @param account
   * @param symbol
   * @returns
   */
  async getStock(time: Date, account: AccountNumber, symbol: TradeableAsset): Promise<StockValueData> {
    const stockPath = `${this.testDir}/stock.json`
    if (!this.stock) {
      if (!fs.existsSync(stockPath)) {
        console.log()
        console.log('\u001b[31mNo stock file found.')
        console.log(`Please add stock file: \u001b[32m${stockPath}`)
        console.log()
        process.exit(1)
      }
      this.stock = JSON.parse(fs.readFileSync(stockPath).toString('utf-8'))
    }
    if (!this.stock) {
      return { amount: 0, value: 0 }
    }
    if (!this.stock[account]) {
      this.stock[account] = {}
    }

    const stock: Record<AccountNumber, StockValueData> = this.stock[account] as Record<AccountNumber, StockValueData>

    if (stock[symbol] === undefined) {
      console.log()
      console.log(`\u001b[31mStock not defined for ${symbol} on account ${account} in ${stockPath}.`)
      console.log(`Creating a slot for it. Please edit stock file if needed: \u001b[32m${stockPath}`)
      console.log()
      stock[symbol] = { amount: 0, value: 0 }
      fs.writeFileSync(stockPath, JSON.stringify(this.stock, null, 2) + '\n')
      process.exit(1)
    }

    return stock[symbol]
  }

  async getVAT(time: Date, transfer: AssetTransfer, currency: Currency): Promise<null | number> {
    const { reason, type, asset } = transfer
    if (reason === 'expense' && type === 'statement') {
      const vat = this.knowledge.vat(asset as VATTarget, time)
      return vat || null
    }
    if (reason === 'income' && type === 'statement') {
      // Goes directly from invoicing to VAT and here we use receivables.
      // Could be option though.
      return 0
    }
    return null
  }

  /**
   * Implement rates by reading values from the rates.json file.
   * @param time
   * @param type
   * @param asset
   * @param exchange
   * @returns
   */
  async getRate(time: Date, type: AssetType, asset: Asset, currency: Currency, exchange: AssetExchange|null = null): Promise<number> {
    const ratesPath = `${this.testDir}/rates.json`
    let rates
    if (!fs.existsSync(ratesPath)) {
      console.log()
      console.log('\u001b[36mNo asset rate file found.')
      console.log(`Creating new rates file: \u001b[32m${ratesPath}\u001b[0m`)
      console.log()
      rates = {}
      fs.writeFileSync(ratesPath, '{}')
    } else {
      rates = JSON.parse(fs.readFileSync(ratesPath).toString('utf-8'))
    }
    const stamp = dayjs(time).format('YYYY-MM-DD')
    if (!rates[stamp]) {
      rates[stamp] = {}
    }
    if (!rates[stamp][asset]) {
      let result

      if (type === 'currency') {
        result = await getTestCurrencyRate(asset, currency, stamp)
      } else if (type === 'crypto') {
        result = await getTestCryptoRate(asset, currency, stamp)
      }

      if (result) {
        rates[stamp][asset] = result
        fs.writeFileSync(ratesPath, JSON.stringify(rates, null, 2))
        console.log(`\u001b[36mGot rate for ${asset} at ${stamp} and saved ${ratesPath}.\u001b[0m`)
      } else {
        rates[stamp][asset] = null
        fs.writeFileSync(ratesPath, JSON.stringify(rates, null, 2))
        console.log()
        console.log(`\u001b[31mRate not defined for ${asset} at ${stamp} in ${ratesPath}.`)
        console.log(`Update rates file: \u001b[32m${ratesPath}`)
        console.log()
        process.exit()
      }
    }
    return rates[stamp][asset]
  }

  async applyResult(): Promise<Record<string, unknown>> {
    return {}
  }

  async resultExists(processId: ID, args: unknown): Promise<boolean> {
    return false
  }

  /**
   * Hook called after process is finished. Verify that all result match.
   * @param res
   */
  async success(res: ImportState) {
    this.result = res
    const txs = sortTransactions(this.collectTransactions(res))
    this.verifyTransactions(txs)
    await this.verifyAccounts(txs)
    this.verifyStock(txs)
    if (!this.watch) {
      this.server.stop()
    }
  }

  async fail(res: ImportState) {
    if (!this.watch) {
      error('Test failed.')
      process.exit(-1)
    }
  }

  async waiting(res: ImportState, directions: Directions) {
    if (directions && directions.type === 'ui' && directions.element) {
      const answerPath = `${this.testDir}/answers.json`
      const answers: Record<string, Record<string, unknown>> = fs.existsSync(answerPath) ? JSON.parse(fs.readFileSync(answerPath).toString('utf-8')) : {}

      for (const name of elementNames(directions.element)) {
        const [prefix, segmentId, ...rest] = name.split('.')

        if (prefix !== 'answer') {
          continue
        }

        if (!answers[segmentId]) {
          answers[segmentId] = {}
        }

        const q: string = rest.join('.')
        if (!answers[segmentId][q]) {
          answers[segmentId][q] = null
        }
      }

      console.log()
      console.log('\u001b[36mStopped for UI query:\u001b[0m')
      if ('config' in directions.element) {
        directions.element.config = {
          config: '* * * removed * * *'
        }
      }
      console.dir(directions.element, { depth: null })

      console.log()
      console.log(`Adding new entries to answer file: \u001b[32m${answerPath}`)
      fs.writeFileSync(answerPath, JSON.stringify(answers, null, 2) + '\n')
      console.log()
      process.exit(1)
    }
  }

  /**
   * Parse result structures and collect actual transacions.
   * @param res
   * @returns
   */
  collectTransactions(res: ImportState): Transaction[] {
    let txs: Transaction[] = []
    if (res.result) {
      for (const r of Object.values(res.result)) {
        const resultSets = r as TransactionDescription[]
        for (const result of resultSets) {
          if (result.transactions) {
            txs = txs.concat(result.transactions)
          }
        }
      }
    }
    return txs
  }

  /**
   * Verify the result or display JSON-file if not yet known.
   * @param txs
   * @param answer
   */
  verifyTransactions(txs: Transaction[]) {
    const transactionPath = `${this.testDir}/transactions.json`
    if (fs.existsSync(transactionPath)) {
      const transactions: Transaction[] = JSON.parse(fs.readFileSync(transactionPath).toString('utf-8'))
      let next = 0
      for (let i = 0; i < txs.length; i++) {
        const target = transactions[next]
        if (!target) {
          return this.failExit('More transactions than expecteed.', txs.slice(i), [])
        }
        if (txs[i].executionResult === 'ignored') {
          continue
        }
        next++
        if (new Date(target.date).getTime() !== new Date(txs[i].date).getTime()) {
          return this.failExit('Dates are different.', target, txs[i])
        }
        for (let j = 0; j < target.entries.length; j++) {
          if (target.entries[j].account !== txs[i].entries[j].account) {
            return this.failExit(`Entry #${j + 1} is has different account.`, target, txs[i])
          }
          if (target.entries[j].amount !== txs[i].entries[j].amount) {
            return this.failExit(`Entry #${j + 1} is has different amount.`, target, txs[i])
          }
          if (target.entries[j].description !== txs[i].entries[j].description) {
            return this.failExit(`Entry #${j + 1} is has different description.`, target, txs[i])
          }
          const data = target.entries[j].data
          if (data !== undefined) {
            if (data.stock) {
              if (!txs[i].entries[j].data || !deepEqual(data.stock, txs[i].entries[j].data?.stock)) {
                return this.failExit(`Entry #${j + 1} is has different stock data.`, target, txs[i])
              }
            }
            if (data.rates) {
              if (!txs[i].entries[j].data || !deepEqual(data.rates, txs[i].entries[j].data?.rates)) {
                return this.failExit(`Entry #${j + 1} is has different rates data.`, target, txs[i])
              }
            }
            if (!deepEqual(data, txs[i].entries[j].data)) {
              return this.failExit(`Entry #${j + 1} is has different extra data.`, target, txs[i])
            }
          }
        }
      }
    } else {
      this.printLedger(txs)
      console.log()
      console.log('\u001b[31mNo file for transactions found.')
      console.log(`Generating new transaction file: \u001b[32m${transactionPath}`)
      console.log('\u001b[31mPlease verify carefully that it is correct.')
      const transactions = txs.filter(tx => tx.executionResult !== 'ignored').map(tx => ({ ...tx, executionResult: undefined }))
      fs.writeFileSync(transactionPath, JSON.stringify(transactions, null, 2) + '\n')
      console.log()
      process.exit(1)
    }
  }

  /**
   * Collect account totals and verify.
   */
  async verifyAccounts(txs: Transaction[]) {
    const initialPath = `${this.testDir}/balance.json`
    const accounts = fs.existsSync(initialPath) ? JSON.parse(fs.readFileSync(initialPath).toString('utf-8')) : {}

    for (let i = 0; i < txs.length; i++) {
      for (let j = 0; j < txs[i].entries.length; j++) {
        const { account, amount } = txs[i].entries[j]
        accounts[account] = (accounts[account] || 0) + amount
      }
    }
    const answerPath = `${this.testDir}/end-balance.json`
    if (fs.existsSync(answerPath)) {
      const answers: Record<AccountNumber, number> = JSON.parse(fs.readFileSync(answerPath).toString('utf-8'))
      for (const number of Object.keys(answers).concat(Object.keys(accounts))) {
        if (answers[number] !== accounts[number]) {
          return this.failExit(`Balance did not match for account ${number}`, answers, accounts)
        }
      }
    } else {
      console.log()
      console.log('\u001b[31mNo answer file for end balances found.')
      console.log(`Generating new answer file: \u001b[32m${answerPath}`)
      console.log('\u001b[31mPlease verify carefully that it is correct.')
      fs.writeFileSync(answerPath, JSON.stringify(accounts, null, 2) + '\n')
      console.log()
      process.exit(1)
    }
  }

  /**
   * Collect stock changes and verify.
   */
  verifyStock(txs: Transaction[]) {
    const stock: Record<AccountNumber, Record<TradeableAsset, { amount: number, value: number }>> = {}
    const initialPath = `${this.testDir}/stock.json`
    if (fs.existsSync(initialPath)) {
      Object.assign(stock, JSON.parse(fs.readFileSync(initialPath).toString('utf-8')))
    }
    for (let i = 0; i < txs.length; i++) {
      for (let j = 0; j < txs[i].entries.length; j++) {
        const { account, data } = txs[i].entries[j]
        if (data && data.stock) {
          if (data.stock.change) {
            stock[account] = stock[account] || {}
            Object.entries(data.stock.change).forEach(([ticker, change]) => {
              if (change) {
                stock[account][ticker] = stock[account][ticker] || { amount: 0, value: 0 }
                stock[account][ticker].amount += change.amount
                stock[account][ticker].value += change.value
                if (Math.abs(stock[account][ticker].amount) < ZERO_STOCK) {
                  stock[account][ticker].amount = 0
                }
                if (Math.abs(stock[account][ticker].value) < ZERO_CENTS) {
                  stock[account][ticker].value = 0
                }
              }
            })
          }
        }
      }
    }

    // Compare stock.
    const answerPath = `${this.testDir}/end-stock.json`
    if (fs.existsSync(answerPath)) {
      const answers: Record<TradeableAsset, number> = JSON.parse(fs.readFileSync(answerPath).toString('utf-8'))
      for (const account of Object.keys(answers).concat(Object.keys(stock))) {
        for (const ticker of Object.keys(answers[account] || {}).concat(Object.keys(stock[account] || {}))) {
          const { amount, value } = answers[account] && answers[account][ticker] ? answers[account][ticker] : { amount: 0, value: 0 }
          const resultAmount = stock[account] && stock[account][ticker] ? stock[account][ticker].amount : 0
          const resultValue = stock[account] && stock[account][ticker] ? stock[account][ticker].value : 0
          if (amount !== resultAmount || value !== resultValue) {
            return this.failExit(`Stock did not match on account ${account} for ticker ${ticker}`, answers[account][ticker], stock[account][ticker])
          }
        }
      }
    } else {
      this.printStock(txs)
      console.log()
      console.log('\u001b[31mNo answer file for end stock found.')
      console.log(`Generating new answer file: \u001b[32m${answerPath}`)
      console.log('\u001b[31mPlease verify carefully that it is correct.')
      for (const account of Object.keys(stock)) {
        for (const ticker of Object.keys(stock[account])) {
          if (!stock[account][ticker].amount) {
            delete stock[account][ticker]
          }
        }
      }

      fs.writeFileSync(answerPath, JSON.stringify(stock, null, 2) + '\n')
      console.log()
      process.exit(1)
    }
  }

  /**
   * Show the failing entry and quit.
   * @param msg
   * @param correct
   */
  failExit(msg: string, correct: any, failed: any) {
    correct = clone(correct)
    failed = clone(failed)
    if (correct && failed) {
      Object.keys(correct).forEach(key => {
        if (correct[key] === failed[key]) {
          delete correct[key]
          delete failed[key]
        }
      })
    }
    console.log('_____________________________________________________________________________________')
    console.log('CORRECT:')
    console.dir(correct, { depth: null })
    console.log('_____________________________________________________________________________________')
    console.log('FAILED:')
    console.dir(failed, { depth: null })
    console.log('_____________________________________________________________________________________')
    this.server.stop(new TestFailure(msg))
  }

  /**
   * Print transactions in ledger like display for easier verification.
   * @param txs
   */
  printLedger(txs: Transaction[]) {
    const ledger: Record<AccountNumber, string[]> = {}
    const initial: Record<AccountNumber, number> = {}
    const balance: Record<AccountNumber, number> = {}
    const stock: Record<AccountNumber, Record<Asset, number>> = {}

    // Read initial balances, if they exists.
    const balancePath = `${this.testDir}/balance.json`
    if (fs.existsSync(balancePath)) {
      Object.assign(initial, JSON.parse(fs.readFileSync(balancePath).toString('utf-8')))
      Object.assign(balance, initial)
    }

    // Read initial stock, if it exists.
    const stockPath = `${this.testDir}/stock.json`
    if (fs.existsSync(stockPath)) {
      Object.assign(stock, JSON.parse(fs.readFileSync(stockPath).toString('utf-8')))
    }

    // Extract ledger for each account.
    for (const tx of txs) {
      for (const entry of tx.entries) {
        balance[entry.account] = (balance[entry.account] || 0) + entry.amount
        ledger[entry.account] = ledger[entry.account] || []
        let curVal = ''
        if (entry.data && entry.data.currency && isCurrency(entry.data.currency) && entry.data.currencyValue) {
          curVal = ` | ${sprintf('%.2f', entry.data.currencyValue / 100)} ${entry.data.currency}`
        }
        const date = dayjs(tx.date).format('YYYY-MM-DD')
        const amount = sprintf('%.2f', entry.amount / 100)
        const sum = sprintf('%.2f', balance[entry.account] / 100)
        const description = entry.description + curVal
        ledger[entry.account].push(sprintf('%10s %10s %10s   %s', date, amount, sum, description))
        if (entry.data) {
          Object.keys(entry.data).forEach(key => {
            ledger[entry.account].push(sprintf('%35s\u001b[36m%s = %s\u001b[0m', '', key, JSON.stringify(entry.data && entry.data[key])))
          })
        }
      }
    }

    // Helper to resolve account name.
    const accName = (number) => {
      const accs = Object.entries(this.config).filter(([k, v]) => v === number).map(([k, v]) => k)
      return accs.join(', ')
    }

    // Print by account.
    for (const account of Object.keys(ledger)) {
      console.log()
      console.log(`\u001b[33m${account} ${accName(account)}\u001b[0m`)
      console.log(sprintf('%41s', `\u001b[34m${sprintf('%.2f', (initial[account] || 0.00) / 100)}\u001b[0m`))
      if (stock[account]) {
        Object.keys(stock[account]).forEach(key => {
          console.log(sprintf('%35s\u001b[34m%f %s (%f / %s)\u001b[0m',
            '',
            stock[account][key].amount,
            key,
            stock[account][key].amount ? stock[account][key].value / (stock[account][key].amount * 100) : 0,
            key))
        })
      }
      console.log(ledger[account].join('\n'))
      console.log(sprintf('%41s', `\u001b[34m${sprintf('%.2f', balance[account] / 100)}\u001b[0m`))
    }
  }

  /**
   * Print changes in the stock.
   * @param txs
   */
  printStock(txs: Transaction[]) {
    const result: Record<AccountNumber, Record<Asset, string[]>> = {}
    const totals: Record<AccountNumber, Record<Asset, StockValueData>> = {}

    // Read initial stock, if it exist.
    const initialPath = `${this.testDir}/stock.json`
    if (fs.existsSync(initialPath)) {
      Object.assign(totals, JSON.parse(fs.readFileSync(initialPath).toString('utf-8')))
      for (const account of Object.keys(totals)) {
        result[account] = {}
        for (const ticker of Object.keys(totals[account])) {
          result[account][ticker] = []
          result[account][ticker].push('Initial stock')
          result[account][ticker].push(`  \u001b[34m${totals[account][ticker].amount} ${ticker}\u001b[0m`)
          result[account][ticker].push(`  \u001b[34m${totals[account][ticker].value / 100} EUR\u001b[0m`)
        }
      }
    }

    // Collect changes.
    for (const tx of txs) {
      for (const entry of tx.entries) {
        if (entry.data && entry.data.stock && entry.data.stock.change) {
          const changes = entry.data.stock.change
          const text = `${dayjs(tx.date).format('YYYY-MM-DD')}\t${sprintf('%.2f', entry.amount / 100)}\t${entry.description}`
          const account = entry.account
          for (const ticker of Object.keys(changes)) {
            result[account] = result[account] || {}
            result[account][ticker] = result[account][ticker] || []
            result[account][ticker].push(text)
            result[account][ticker].push(`  ${changes[ticker].amount < 0 ? '' : '+'}${changes[ticker].amount} ${ticker}`)
            result[account][ticker].push(`  ${changes[ticker].value < 0 ? '' : '+'}${changes[ticker].value / 100} EUR`)

            totals[account] = totals[account] || {}
            totals[account][ticker] = totals[account][ticker] || { value: 0, amount: 0 }
            totals[account][ticker].amount += changes[ticker].amount
            totals[account][ticker].value += changes[ticker].value
            result[account][ticker].push(`  \u001b[34m${totals[account][ticker].amount} ${ticker}\u001b[0m`)
            result[account][ticker].push(`  \u001b[34m${totals[account][ticker].value / 100} EUR\u001b[0m`)
          }
        }
      }
    }

    // Print changes.
    for (const account of Object.keys(result)) {
      for (const ticker of Object.keys(result[account])) {
        console.log()
        console.log(`\u001b[33m${account} ${ticker}\u001b[0m`)
        console.log(result[account][ticker].join('\n'))
      }
    }
  }

  async rollback(processId: ID): Promise<boolean> {
    return true
  }

  /**
   * Launch the server.
   */
  async run(): Promise<void> {
    const server = new ISPDemoServer(
      PORT,
      DATABASE_URL,
      // This causes way too often silly version incompatibility errors if not cast unknown.
      [this.handler as unknown as ProcessHandler],
      this
    )
    server.start()
  }
}
