import { log } from '@dataplug/tasenor-common'
import { Command } from '.'
import { ArgumentParser } from 'argparse'

class UserCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const ls = sub.add_parser('ls', { help: 'List all users' })
    ls.set_defaults({ subCommand: 'ls' })

    const rm = sub.add_parser('rm', { help: 'Delete a user' })
    rm.set_defaults({ subCommand: 'rm' })
    rm.add_argument('email', { help: 'Email address of the user' })

    const create = sub.add_parser('create', { help: 'Create a user' })
    create.set_defaults({ subCommand: 'create' })
    create.add_argument('name', { help: 'Full name of the user' })
    create.add_argument('passwd', { help: 'Initial password for the user' })
    create.add_argument('email', { help: 'Email address of the user' })

    const add = sub.add_parser('add', { help: 'Add a user to the database' })
    add.set_defaults({ subCommand: 'add' })
    add.add_argument('email', { help: 'Email address of the user' })
    add.add_argument('db', { help: 'Name of the database' })
  }

  async ls() {
    const resp = await this.get('/admin/user')
    this.out('user', resp)
  }

  print(data): void {
    for (const user of data.sort((a, b) => (a.id || 0) - (b.id || 0))) {
      const { id, name, email, config } = user
      console.log(`#${id} ${name} ${email} ${JSON.stringify(config)}`)
    }
  }

  async rm() {
    const { email } = this.args
    await this.delete(`/admin/user/${email}`)
    log(`User ${email} deleted successfully.`)
  }

  async create() {
    const { name, passwd, email } = this.args
    const params = { name, password: passwd, email }
    await this.post('/admin/user', params)
    log(`User ${name} created successfully.`)
  }

  async add() {
    const { email, db } = this.args
    log(`Adding user ${email} to database ${db}`)
    await this.post(`/admin/user/${email}/databases`, { database: this.str(db) })
  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default UserCommand
