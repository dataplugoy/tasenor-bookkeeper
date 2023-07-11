/* eslint-disable camelcase */
import { log, AccountModelData } from '@dataplug/tasenor-common'
import { Command } from '.'
import { ArgumentParser } from 'argparse'

class AccountCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const ls = sub.add_parser('ls', { help: 'List all accounts' })
    ls.set_defaults({ subCommand: 'ls' })
    ls.add_argument('db', { help: 'Name of the database' })

    const rm = sub.add_parser('rm', { help: 'Delete an account' })
    rm.set_defaults({ subCommand: 'rm' })
    rm.add_argument('db', { help: 'Name of the database' })
    rm.add_argument('id', { help: 'ID of the account' })

    const create = sub.add_parser('create', { help: 'Create an account' })
    create.set_defaults({ subCommand: 'create' })
    create.add_argument('db', { help: 'Name of the database' })
    create.add_argument('language', { help: 'Account language' })
    create.add_argument('currency', { help: 'Account currency' })
    create.add_argument('type', { help: 'Account type' })
    create.add_argument('number', { help: 'Account number' })
    create.add_argument('name', { help: 'Account name' })
    create.add_argument('data', { help: 'Additional account data in JSON format', nargs: '?' })
  }

  async ls() {
    const { db } = this.args
    const resp = await this.get(`/db/${db}/account`)
    this.out('account', resp)
  }

  print(data: AccountModelData[]): void {
    for (const account of data.sort((a, b) => (a.id || 0) - (b.id || 0))) {
      const { id, number, name, type, language, currency, data } = account
      console.log(`#${id} [${language} ${currency} ${type}] ${number} ${name} ${Object.keys(data).length ? JSON.stringify(data) : ''}`)
    }
  }

  async rm() {
    const { db, id } = this.args
    await this.delete(`/db/${db}/account/${id}`)
    log(`Account ${id} deleted successfully.`)
  }

  async create() {
    const { db, number, name, type, language, currency, data } = this.args
    const params = {
      number,
      name,
      type,
      language,
      currency,
      data: data ? await this.jsonData(data) : {}
    }
    await this.post(`/db/${db}/account`, params)
    log(`Account ${number} ${name} created successfully.`)
  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default AccountCommand
