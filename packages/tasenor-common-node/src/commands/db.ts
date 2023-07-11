import { DatabaseModelData, FilePath, log } from '@dataplug/tasenor-common'
import { ArgumentParser } from 'argparse'
import fs from 'fs'
import { Command } from '.'

class DbCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const ls = sub.add_parser('ls', { help: 'List all databases' })
    ls.set_defaults({ subCommand: 'ls' })

    const create = sub.add_parser('create', { help: 'Create a database' })
    create.set_defaults({ subCommand: 'create' })
    create.add_argument('scheme', { help: 'Bookkeeping scheme plugin code' })
    create.add_argument('databaseName', { help: 'Name of the new database' })
    create.add_argument('companyName', { nargs: '?', help: 'Name of the company (optional)' })
    create.add_argument('companyCode', { nargs: '?', help: 'Registration code of the company (optional)' })
    create.add_argument('language', { nargs: '?', help: 'Database language (optional)' })
    create.add_argument('currency', { nargs: '?', help: 'Currency (optional)' })

    const rm = sub.add_parser('rm', { help: 'Delete a database' })
    rm.set_defaults({ subCommand: 'rm' })
    rm.add_argument('databaseName', { help: 'Name of the database' })

    const upload = sub.add_parser('upload', { help: 'Upload a database' })
    upload.set_defaults({ subCommand: 'upload' })
    upload.add_argument('path', { help: 'Path to the file to upload' })

    const download = sub.add_parser('download', { help: 'Download a database' })
    download.set_defaults({ subCommand: 'download' })
    download.add_argument('databaseName', { help: 'Name of the database' })
    download.add_argument('path', { help: 'Path to the file to save' })
  }

  async ls() {
    const resp = await this.get('/db')
    this.out('db', resp)
  }

  print(data: DatabaseModelData[]): void {
    for (const db of data) {
      console.log(db.name)
    }
  }

  async rm() {
    const { databaseName } = this.args
    await this.delete(`/db/${databaseName}`)
    log(`Database ${databaseName} deleted successfully.`)
  }

  async create() {
    const { scheme, databaseName, companyName, companyCode, language, currency } = this.args
    const settings = {
      language, currency
    }
    const params = { scheme, databaseName, companyName, companyCode, settings }
    await this.post('/db', params)
    log(`Database ${databaseName} created successfully.`)
  }

  async upload() {
    const { path } = this.args
    if (!path || !fs.existsSync(this.str(path))) {
      throw new Error(`File path ${path} does not exist.`)
    }
    await this.postUpload('/db/upload', path as FilePath)
    log(`Database ${path} uploaded successfully.`)
  }

  async download() {
    const { path, databaseName } = this.args
    await this.getDownload(`/db/${databaseName}/download`, this.str(path) as FilePath)
    log(`Database ${databaseName} downloaded successfully and saved to ${path}.`)
  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default DbCommand
