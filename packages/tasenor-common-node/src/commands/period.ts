/* eslint-disable camelcase */
import { log, PeriodModelData } from '@dataplug/tasenor-common'
import { Command } from '.'
import { ArgumentParser } from 'argparse'

class PeriodCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const ls = sub.add_parser('ls', { help: 'List all periods' })
    ls.set_defaults({ subCommand: 'ls' })
    ls.add_argument('db', { help: 'Name of the database' })

    const rm = sub.add_parser('rm', { help: 'Delete a period' })
    rm.set_defaults({ subCommand: 'rm' })
    rm.add_argument('db', { help: 'Name of the database' })
    rm.add_argument('id', { help: 'ID of the period' })

    const create = sub.add_parser('create', { help: 'Create a period' })
    create.set_defaults({ subCommand: 'create' })
    create.add_argument('--text', { help: 'A description for the balance transfer transaction', required: false })
    create.add_argument('db', { help: 'Name of the database' })
    create.add_argument('start_date', { help: 'First date of the period YYYY-MM-DD' })
    create.add_argument('end_date', { help: 'Final date of the period YYYY-MM-DD' })
  }

  async ls() {
    const { db } = this.args
    const resp = await this.get(`/db/${db}/period`)
    this.out('period', resp)
  }

  print(data: PeriodModelData[]): void {
    for (const period of data.sort((a, b) => (a.id || 0) - (b.id || 0))) {
      const { id, start_date, end_date } = period
      console.log(`#${id} ${start_date} ${end_date}`)
    }
  }

  async rm() {
    const { db, id } = this.args
    await this.delete(`/db/${db}/period/${id}`)
    log(`Period ${id} deleted successfully.`)
  }

  async create() {
    const { db, start_date, end_date, text } = this.args
    const params = { start_date, end_date, text }
    await this.post(`/db/${db}/period`, params)
    log(`Period ${start_date}...${end_date} created successfully.`)
  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default PeriodCommand
