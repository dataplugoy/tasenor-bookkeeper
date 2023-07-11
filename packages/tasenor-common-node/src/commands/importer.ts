/* eslint-disable camelcase */
import { ImporterModelData, log } from '@dataplug/tasenor-common'
import { Command } from '.'
import { ArgumentParser } from 'argparse'

class ImporterCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const ls = sub.add_parser('ls', { help: 'List all importers' })
    ls.set_defaults({ subCommand: 'ls' })
    ls.add_argument('db', { help: 'Name of the database' })

    const create = sub.add_parser('create', { help: 'Create an importer' })
    create.set_defaults({ subCommand: 'create' })
    create.add_argument('db', { help: 'Name of the database' })
    create.add_argument('name', { help: 'Name of the importer' })
    create.add_argument('plugin', { help: 'Code of the import handler plugin' })

    const set = sub.add_parser('set', { help: 'Set configuration variable for an importer' })
    set.set_defaults({ subCommand: 'set' })
    set.add_argument('db', { help: 'Name of the database' })
    set.add_argument('name', { help: 'The name of the importer' })
    set.add_argument('variable', { help: 'Name of the configuration variable' })
    set.add_argument('value', { help: 'Value for the configuration variable' })

    const config = sub.add_parser('config', { help: 'Set whole configuration for an importer' })
    config.set_defaults({ subCommand: 'config' })
    config.add_argument('db', { help: 'Name of the database' })
    config.add_argument('name', { help: 'The name of the importer' })
    config.add_argument('config', { help: 'JSON data or @filepath for configuration' })
  }

  async ls() {
    const { db } = this.args
    const resp = await this.get(`/db/${db}/importer`)
    this.out('importer', resp)
  }

  print(data: ImporterModelData[]): void {
    for (const importer of data.sort((a, b) => (a.id || 0) - (b.id || 0))) {
      const { id, name, config } = importer
      console.log(`#${id} ${name}`)
      if (config.rules) {
        config.rules = '...skipped...'
      }
      console.dir(config, { depth: null })
      console.log()
    }
  }

  async create() {
    const { db, name, plugin } = this.args
    await this.plugin(plugin)
    const code = this.str(plugin)
    await this.post(`/db/${db}/importer`, { name, config: { handlers: [code] } })
    log(`Importer ${name} created successfully.`)
  }

  async set() {
    const { db, name, variable, value } = this.args
    const importer = await this.importer(db, name)
    const variableArg = this.str(variable)
    const valueArg = this.value(value)
    await this.patch(`/db/${db}/importer/${importer.id}`, { config: { [variableArg]: valueArg } })
    const newImporter: ImporterModelData = await this.get(`/db/${db}/importer/${importer.id}`)
    log(`Variable ${variableArg} set to ${JSON.stringify(newImporter.config[variableArg])}`)
  }

  async config() {
    const { db, name, config } = this.args
    const importer = await this.importer(db, name)
    const configArg = await this.jsonData(config)
    await this.patch(`/db/${db}/importer/${importer.id}`, { config: configArg })
    log(`Updated configuration for importer ${name}`)
  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default ImporterCommand
