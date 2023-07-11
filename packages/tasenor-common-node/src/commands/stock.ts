/* eslint-disable camelcase */
import { sprintf } from 'sprintf-js'
import { Command } from '.'
import { ArgumentParser } from 'argparse'
import { AccountNumber, Asset, DocumentModelData, EntryModelData, log, PeriodModelData, StockValueData } from '@dataplug/tasenor-common'

class StockCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const create = sub.add_parser('create', { help: 'Create initial stock' })
    create.set_defaults({ subCommand: 'create' })
    create.add_argument('db', { help: 'Name of the database' })
    create.add_argument('data', { help: 'A JSON data or @filepath for initial stock data' })
  }

  async create() {
    const { db, data } = this.args
    if (!db) {
      throw new Error(`Invalid database argument ${JSON.stringify(db)}`)
    }
    const dataArg: Record<AccountNumber, Partial<Record<Asset, StockValueData>>> = await this.jsonData(data) as Record<AccountNumber, Partial<Record<Asset, StockValueData>>>
    const period: PeriodModelData = await this.singlePeriod(db)
    const docs: DocumentModelData[] = await this.get(`/db/${db}/document?period=${period.id}&entries`)
    const zeroTx = docs.filter(doc => doc.number === 0)
    if (!zeroTx.length) {
      throw new Error('Cannot set stock unless there is 0-transaction for initial balances defined.')
    }
    if (!zeroTx[0].entries) {
      throw new Error('Cannot set stock unless there are entries in 0-transaction for initial balances.')
    }
    // Get map of indexes in entry list for existing accounts.
    const entryIndex: Record<number, number> = {}
    let i = 0
    for (const entry of zeroTx[0].entries) {
      if (entry.account_id) {
        entryIndex[entry.account_id] = i++
      }
    }
    // Prepare and create missing entries for stock data upates.
    for (const account of Object.keys(dataArg)) {
      const accountId = await this.accountId(db, account)
      if (accountId && !entryIndex[accountId]) {
        const newEntry: EntryModelData = await this.post(`/db/${db}/entry`, {
          document_id: zeroTx[0].id,
          account_id: accountId,
          debit: 1,
          amount: 0,
          description: zeroTx[0].entries[0].description
        })
        log(`Created an entry #${newEntry.id} for ${account} ${zeroTx[0].entries[0].description} ${sprintf('%.2f', 0)}.`)

        zeroTx[0].entries.push(newEntry)
        entryIndex[accountId] = zeroTx[0].entries.length - 1
      }
    }
    // Update stock data.
    for (const account of Object.keys(dataArg)) {
      const accountId = await this.accountId(db, account)
      if (accountId) {
        const entry = zeroTx[0].entries[entryIndex[accountId]]
        entry.data = entry.data || {}
        Object.assign(entry.data, {
          stock: {
            set: dataArg[account]
          }
        })
        await this.patch(`/db/${db}/entry/${entry.id}`, { data: entry.data })
        log(`Updated initial stock data for entry #${entry.id}.`)
      }
    }
  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default StockCommand
