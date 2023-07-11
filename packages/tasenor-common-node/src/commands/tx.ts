/* eslint-disable camelcase */
import { sprintf } from 'sprintf-js'
import { Command } from '.'
import { ArgumentParser } from 'argparse'
import { DocumentModelData, EntryModelData, log } from '@dataplug/tasenor-common'

class TxCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const ls = sub.add_parser('ls', { help: 'List all transactions' })
    ls.set_defaults({ subCommand: 'ls' })
    ls.add_argument('db', { help: 'Name of the database' })
    ls.add_argument('period', { help: 'Period year, date or ID' })

    const rm = sub.add_parser('rm', { help: 'Delete a transaction' })
    rm.set_defaults({ subCommand: 'rm' })
    rm.add_argument('db', { help: 'Name of the database' })
    rm.add_argument('id', { help: 'ID of the transaction' })

    const create = sub.add_parser('create', { help: 'Create a transaction' })
    create.set_defaults({ subCommand: 'create' })
    create.add_argument('--force', { help: 'Allow invalid transactions.', action: 'store_true', required: false })
    create.add_argument('--data', { help: 'Define additional data field for all entries as JSON.', required: false })
    create.add_argument('db', { help: 'Name of the database' })
    create.add_argument('date', { help: 'The transaction date' })
    create.add_argument('entry', { nargs: '+', help: 'A transaction line as string, e.g "1234 Description +12,00" or "1234 Description +12,00 {<data>}"' })
  }

  async ls() {
    const { db, period } = this.args
    const periodId = await this.periodId(db, period)
    const resp = await this.get(`/db/${db}/document?period=${periodId}&entries`)
    await this.readAccounts(db)
    this.out('document', resp)
  }

  print(data: DocumentModelData[]): void {
    for (const doc of data.sort((a, b) => (a.number || 0) - (b.number || 0))) {
      const { number, date } = doc
      console.log(`#${number} ${date}`)
      if (doc.entries) {
        for (const entry of doc.entries) {
          console.log('  ', this.accountsById[entry.account_id || -1].number, sprintf('%.2f', entry.debit ? entry.amount / 100 : entry.amount / -100), entry.description)
        }
      }
    }
  }

  async rm() {
    const { db, id } = this.args
    await this.delete(`/db/${db}/document/${id}`)
    log(`Document ${id} deleted successfully.`)
  }

  async create() {
    const { db, date, data, entry, force } = this.args
    if (!db) {
      throw new Error(`Invalid database argument ${JSON.stringify(db)}`)
    }
    const periodId = await this.periodId(db, date)
    let entries = await this.entries(db, entry)
    if (data) {
      const extras = await this.jsonData(data)
      entries = entries.map(e => ({ ...e, data: extras }))
    }
    const sum = entries.reduce((prev, cur) => prev + cur.amount, 0)
    if (sum && !force) {
      throw new Error(`Transaction total must be zero. Got ${sum} from ${JSON.stringify(entries)}.`)
    }

    const document: DocumentModelData = await this.post(`/db/${db}/document`, { period_id: periodId, date: this.date(date) })
    log(`Created a document #${document.id} on ${date}.`)
    for (const e of entries) {
      const out: EntryModelData = await this.post(`/db/${db}/entry`, {
        document_id: document.id,
        account_id: e.account_id,
        debit: e.amount > 0,
        amount: Math.abs(e.amount),
        description: e.description,
        data: e.data
      })
      log(`Created an entry #${out.id} for ${e.number} ${e.description} ${sprintf('%.2f', e.amount / 100)}${e.data ? ' ' + JSON.stringify(e.data) : ''}.`)
    }
  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default TxCommand
