import { AccountModel, AccountNumber, DbPeriodModel, StockBookkeeping, StockChangeData, ID, PeriodModelData, HttpResponse } from '@dataplug/tasenor-common'
import { KnexDatabase } from '@dataplug/tasenor-common-node'
import dayjs from 'dayjs'
import data from './data'

/**
 * Find the period containing the given date.
 * @param db
 * @param time
 * @returns
 */
export async function periodOf(db: KnexDatabase, time: Date): Promise<DbPeriodModel> {
  const date = dayjs(time).format('YYYY-MM-DD')
  const period = await db('period').select('*').where('start_date', '<=', date).andWhere('end_date', '>=', date).first()
  return period || null
}

/**
 * Collect full summary of all assets in the period.
 * @param db
 * @param id
 */
export async function collectAssets(db: KnexDatabase, id: ID) {
  // Find lines with stock data.
  const stockData = (await db('entry')
    .select('document.date AS time', 'account.number', 'entry.data')
    .join('document', 'entry.document_id', 'document.id')
    .join('account', 'entry.account_id', 'account.id')
    .whereRaw("entry.data->'stock' IS NOT NULL")
    .andWhere({ period_id: id })
    .orderBy('document.date', 'document.number')
  )
  // Collect per account.
  const stock: Record<AccountNumber, StockBookkeeping> = {}
  for (const line of stockData) {
    if (!(line.number in stock)) {
      stock[line.number] = new StockBookkeeping(`Account ${line.number}`)
    }
    stock[line.number].apply(line.time, line.data)
  }
  // Construct single summary.
  const results: Record<AccountNumber, StockChangeData> = {}
  for (const number of Object.keys(stock)) {
    const data = stock[number].summary(1e-12, false, false)
    if (Object.keys(data).length > 0) {
      results[number] = { stock: { set: data } }
    }
  }
  return results
}

/**
 * Create new period.
 * @param period
 */
export async function create(db: KnexDatabase, period: PeriodModelData, initText: string | undefined): Promise<HttpResponse | null> {
  const last = await db('period').orderBy('end_date', 'desc').limit(1).first()
  const newPeriod = await data.createOne(db, 'period', period)
  const records: { id: ID, number: string, balance: number }[] = []
  let assets: Record<AccountNumber, StockChangeData> = {}

  if (last) {
    // Preparations.
    const profitAcc = await db('account').where({ type: 'PROFIT_PREV' }).first()
    if (!profitAcc) {
      return { success: false, status: 400, message: 'Cannot find profit account' }
    }
    const balances = await data.getPeriodBalances(db, last.id)
    assets = await collectAssets(db, last.id)

    const accounts = await db('account').whereIn('id', balances.balances.map(balance => balance.id))
    const accountsById: Record<number, AccountModel> = {}
    accounts.forEach(acc => (accountsById[acc.id] = acc))

    // Summarize profits.
    let profit = 0

    balances.balances.forEach(balance => {
      const acc = accountsById[balance.id]
      switch (acc.type) {
        case 'ASSET':
        case 'LIABILITY':
        case 'EQUITY':
          if (Math.abs(balance.total || 0) > 0.0001) {
            records.push({ id: acc.id, number: acc.number as AccountNumber, balance: balance.total || 0 })
          }
          break
        case 'REVENUE':
        case 'EXPENSE':
        case 'PROFIT_PREV':
          profit += balance.total || 0
          break
        default:
          throw new Error(`No idea how to handle ${acc.type} account, when creating new period.`)
      }
    })

    if (profit) {
      records.push({ id: profitAcc.id, number: profitAcc.number as AccountNumber, balance: profit })
    }
    records.sort((a, b) => (a.number > b.number ? 1 : (a.number < b.number ? -1 : 0)))
  }

  // Create document for initial balances.
  const zeroDoc = await db('document').insert({ number: 0, period_id: newPeriod.id, date: newPeriod.start_date }).returning('id')

  for (let i = 0; i < records.length; i++) {
    await db('entry').insert({
      document_id: zeroDoc[0].id,
      account_id: records[i].id,
      debit: records[i].balance >= 0 ? 1 : 0,
      amount: Math.abs(records[i].balance) / 100,
      description: initText || 'Initial balance',
      row_number: i + 1,
      data: records[i].number in assets ? assets[records[i].number] : {}
    })
  }

  return { success: true, status: 200, data: newPeriod }
}
