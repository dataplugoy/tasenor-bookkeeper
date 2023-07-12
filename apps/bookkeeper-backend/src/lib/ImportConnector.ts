import { AccountNumber, Asset, AssetExchange, AssetTransfer, AssetType, CryptoCurrency, Currency, Language, log, StockBookkeeping, StockValueData, TradeableAsset, TransactionDescription, Importer, TransactionApplyResults, BalanceBookkeeping, AccountAddress, Transaction, address2sql, PluginCode, Knowledge, KnowledgeBase, ID, ProcessConfig, setIntersect } from '@dataplug/tasenor-common'
import { TransactionImportHandler, ImportPlugin, KnexDatabase, TransactionImportConnector, TransactionUI, SystemError } from '@dataplug/tasenor-common-node'
import { createTransaction, deleteTransaction } from './importing'
import { getCryptoRate, getCurrencyRate } from './services'
import { periodOf } from './period'
import catalog from './catalog'
import dayjs from 'dayjs'

/**
 * Implementation for bookkeeper backend to provide connector for importing.
 */
export class ImportConnector implements TransactionImportConnector {

  db: KnexDatabase
  importer: Importer

  constructor(db: KnexDatabase, importer: Importer) {
    this.importer = importer
    this.db = db
  }

  async initialize(): Promise<void> {
    log('Connector initialized.')
  }

  async checkDateRange(tx: Transaction, config: ProcessConfig) {
    const date = dayjs(tx.date).format('YYYY-MM-DD')
    const { firstDate, lastDate, badTransactionDates } = config
    const language = config.language as Language
    if (date < `${firstDate}` || date > `${lastDate}`) {
      const text = (await this.getTranslation('The date {date} falls outside of the period {firstDate} to {lastDate}.', language)).replace('{date}', date).replace('{firstDate}', firstDate as string).replace('{lastDate}', lastDate as string)

      // Handle if ignored.
      if (badTransactionDates === 'ignore') {
        tx.executionResult = 'ignored'
        return
      }

      // Handle if error.
      if (badTransactionDates === 'error') {
        throw new SystemError(text)
      }

      // No answer yet. Ask.
      const text2 = await this.getTranslation('What do we do with that kind of transactions?', language)
      const opt1 = await this.getTranslation('Ignore transaction', language)
      const opt2 = await this.getTranslation('Halt with an error', language)

      const ui = new TransactionUI({
        getTranslation: (text, language) => this.getTranslation(text, language),
        getAccountCanditates: async () => []
      })
      await ui.throwRadioQuestion(
        text + ' ' + text2,
        'badTransactionDates',
        {
          [opt1]: 'ignore',
          [opt2]: 'error'
        },
        language
      )
    }
  }

  /**
   * Check the result if there is suspiciously identical transaction (that is not marked as imported yet).
   */
  async resultExists(processId: ID, result: TransactionDescription): Promise<boolean> {
    for (const tx of result.transactions || []) {

      // Quick check for segment.
      const old = await this.db('segment_document').select('document_id').where({ segment_id: tx.segmentId, importer_id: this.importer.id }).pluck('document_id')
      if (old.length) {
        // Mark the duplicate.
        tx.executionResult = 'duplicate'
        // However, let the processing continue. We were looking fresh unrelated duplicates.
        return false
      }

      // Find all document IDs for every entry matching and ensure there is one ID having them all.
      const period = await periodOf(this.db, tx.date)
      if (period) {
        let sharedIds: Set<number> | null = null
        for (const entry of tx.entries) {
          const docs = await this.db('document')
            .join('entry', 'document.id', '=', 'entry.document_id')
            .join('account', 'entry.account_id', 'account.id')
            .where({ period_id: period.id, date: tx.date })
            .andWhere('entry.description', '=', entry.description)
            .andWhere('account.number', '=', entry.account)
            .andWhere('entry.data', '=', entry.data || {})
            .andWhere('entry.debit', '=', entry.amount >= 0)
            .andWhereRaw(`entry.amount * 100 = ${Math.abs(entry.amount)}`)
            .pluck('document.id')

          if (docs.length) {
            if (sharedIds === null) {
              sharedIds = new Set(docs as number[])
            } else {
              sharedIds = setIntersect(sharedIds, new Set(docs as number[]))
              if (sharedIds.size === 0) {
                return false
              }
            }
          } else {
            return false
          }
        }
      }
    }

    return true
  }

  /**
   * Create transaction and mark execution result and ID if success.
   * @param processId
   * @param result
   */
  async applyResult(processId: ID, result: TransactionDescription): Promise<Record<'created'|'duplicates', number>> {

    const output = new TransactionApplyResults()
    const { config } = await this.db('processes').select('config').where({ id: processId }).first()

    if (result.transactions) {
      let n = 0
      for (const tx of result.transactions) {

        // Check for dates outside the import range.
        await this.checkDateRange(tx, config)

        // Skip those that has been marked already as ignored, skipped or duplicated.
        if (tx.executionResult === 'ignored') {
          output.ignore(tx)
          continue
        }
        if (tx.executionResult === 'skipped') {
          output.skip(tx)
          continue
        }
        if (tx.executionResult === 'duplicate') {
          output.duplicate(tx)
          continue
        }

        // All good, let's create the transaction.
        const doc = await createTransaction(this.db, tx, processId, this.importer.id, n > 0)
        tx.id = doc.id
        tx.executionResult = 'created'
        output.create(tx)
        n++
      }
    }

    return output
  }

  async rollback(processId: ID): Promise<boolean> {
    const docs = await this.db('segment_document').select('document_id').where({ process_id: processId }).pluck(('document_id'))
    for (const id of docs) {
      await deleteTransaction(this.db, id)
      await this.db('segment_document').where({ process_id: processId }).where({ document_id: id }).delete()
    }
    return true
  }

  async success(): Promise<void> {
    log('Process completed.')
  }

  async waiting(): Promise<void> {
    // No action.
  }

  async fail(): Promise<void> {
    // No action.
  }

  async initializeBalances(time: Date, balances: BalanceBookkeeping, config: ProcessConfig): Promise<void> {
    const period = await periodOf(this.db, time)
    if (!period) {
      throw new Error(`Cannot find period for timestamp '${time}'.`)
    }
    const credit = (await this.db('document')
      .join('entry', 'document.id', '=', 'entry.document_id')
      .join('account', 'entry.account_id', '=', 'account.id')
      .select('account.number')
      .sum('entry.amount')
      .where('entry.debit', '=', false)
      .andWhere('document.period_id', '=', period.id)
      .andWhere('document.date', '<', time)
      .groupBy('account.number'))
    const debit = (await this.db('document')
      .join('entry', 'document.id', '=', 'entry.document_id')
      .join('account', 'entry.account_id', '=', 'account.id')
      .select('account.number')
      .sum('entry.amount')
      .where('entry.debit', '=', true)
      .andWhere('document.period_id', '=', period.id)
      .andWhere('document.date', '<', time)
      .groupBy('account.number'))

    const balance: Record<AccountNumber, number> = {}

    debit.forEach(record => {
      const { number, sum } = record
      balance[number] = (balance[number] || 0) + parseFloat(sum) * 100
    })

    credit.forEach(record => {
      const { number, sum } = record
      balance[number] = (balance[number] || 0) - parseFloat(sum) * 100
    })
    balances.configureNames(config)
    Object.keys(balance).forEach(number => balances.set(number as AccountNumber, balance[number]))
  }

  async getAccountCanditates(addr: AccountAddress, config: ProcessConfig): Promise<AccountNumber[]> {
    const knowledge = new Knowledge(await catalog.getKnowledge() as KnowledgeBase)
    const sql = address2sql(addr, {
      defaultCurrency: 'EUR',
      plugin: config.plugin as PluginCode
    }, knowledge)
    return sql ? this.db('account').select('number').pluck('number').whereRaw(sql) : []
  }

  async getTranslation(text: string, language: Language): Promise<string> {
    // We don't care accessibility. Just translate using the base class.
    const plugin = new ImportPlugin(new TransactionImportHandler('No name'))
    const ret: string = plugin.t(text, language)
    if (ret !== text) {
      return ret
    }
    return catalog.t(text, language)
  }

  /**
   * Use internal services to query asset rate at historical date.
   * @param time
   * @param type
   * @param asset
   * @param currency
   * @param exchange
   * @returns
   */
  async getRate(time: Date, type: AssetType, asset: Asset, currency: Currency, exchange: AssetExchange): Promise<number> {
    switch (type) {
      case 'currency':
        return getCurrencyRate(time, asset as Currency, currency)
      case 'crypto':
        return getCryptoRate(time, asset as CryptoCurrency, currency, exchange)
      default:
        throw new Error(`An asset type '${type}' for rate query is not yet supported.`)
    }
  }

  /**
   * Find the latest record in DB for an asset stock before the given timestamp.
   * @param time
   * @param account
   * @param symbol
   * @returns
   */
  async getStock(time: Date, account: AccountNumber, symbol: TradeableAsset): Promise<StockValueData> {
    const period = await periodOf(this.db, time)
    if (!period) {
      throw new Error(`Cannot find period for timestamp '${time.toISOString()}'.`)
    }

    const data = (await this.db('document')
      .join('entry', 'document.id', '=', 'entry.document_id')
      .join('account', 'entry.account_id', '=', 'account.id')
      .select('document.date AS time', 'entry.data')
      .whereRaw("entry.data->'stock' IS NOT NULL")
      .andWhere('document.period_id', '=', period.id)
      .andWhere('document.date', '<', time)
      .andWhere('account.number', '=', account)
      .orderBy('document.date', 'document.number'))

    const stock = new StockBookkeeping('Historical stock')
    stock.applyAll(data)
    const type = stock.getType(symbol)
    return stock.has(type, symbol) ? stock.last(type, symbol) : { amount: 0, value: 0 }
  }

  async getVAT(time: Date, transfer: AssetTransfer, currency: Currency): Promise<null | number> {
    const { reason, type } = transfer
    if (reason === 'expense' && type === 'statement') {
      const vat = await catalog.getVAT(time, transfer, currency)
      return vat
    }
    if (reason === 'income' && type === 'statement') {
      // Goes directly from invoicing to VAT and here we use receivables.
      // Could be option though.
      return 0
    }
    return null
  }
}
