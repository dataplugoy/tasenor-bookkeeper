import fs from 'fs'
import path from 'path'
import { AccountModelData, AccountNumber, ImporterModelData, TasenorPlugin, HttpResponse, FilePath, PeriodModelData, ShortDate, TagModelData, ID } from '@dataplug/tasenor-common'
import { ArgumentParser } from 'argparse'
import FormData from 'form-data'
import axios from 'axios'

export type CommandArgument = string | null | undefined | string[]
/**
 * Argument container type for commands.
 */
export type CommandArguments = Record<string, CommandArgument>

/**
 * Definition of argument name, corresponding environment variable and default value.
 */
export type CommandArgumentDefault = {
  name: string
  envName: string
  defaultValue: string
}

/**
 * Data for creating entries.
 */
export type CommandEntryData = {
  account_id: ID
  number?: AccountNumber
  amount: number
  description: string
  data?: Record<string, any>
}

/**
 * A command implementation base class.
 */
export class Command {

  protected cli
  protected accounts: Record<AccountNumber, AccountModelData>
  protected accountsById: Record<number, AccountModelData>
  protected plugins: TasenorPlugin[]
  protected importers: ImporterModelData[]
  protected args: CommandArguments

  constructor(cli) {
    this.cli = cli
  }

  get verbose() {
    return !!this.args.verbose
  }

  get debug() {
    return !!this.args.debug
  }

  /**
   * Add command specific arguments.
   * @param parser
   */
  addArguments(parser: ArgumentParser): void {
  }

  /**
   * Set command arguments.
   * @param args
   */
  setArgs(args: CommandArguments) {
    this.args = args
  }

  /**
   * Default output.
   * @param data
   */
  print(data: any): void {
    throw new Error(`Class ${this.constructor.name} does not implement print().`)
  }

  /**
   * Print out data structure according to the selected options.
   * @param data
   */
  out(prefix, data) {
    if (this.args.json) {
      console.log(JSON.stringify(data, null, 2))
    } else {
      if (!this.verbose) {
        try {
          this.print(data)
          return
        } catch (err) {
          // If not implemented, do default verbose output.
          if (!/does not implement print/.test(`${err}`)) {
            throw err
          }
        }
      }
      const print = (prefix: string, obj: any): void => {
        if (typeof obj === 'object') {
          if (obj === null) {
            console.log(`${prefix} = null`)
          } else if (obj instanceof Array) {
            for (let i = 0; i < obj.length; i++) {
              console.log(`${prefix}[${i}]`)
              print(`  ${prefix}[${i}]`, obj[i])
            }
          } else {
            for (const key of Object.keys(obj)) {
              print(`  ${prefix}.${key}`, obj[key])
            }
          }
        } else {
          console.log(`${prefix} =`, obj)
        }
      }
      print(prefix, data)
    }
  }

  /**
   * Entry point for running the command.
   * @param args
   */
  async run() {
    throw new Error(`A command ${this.constructor.name} does not implement run().`)
  }

  /**
   * Construct a form data instance for a file.
   * @param filePath
   * @returns
   */
  formForFile(filePath: FilePath): FormData {
    const form = new FormData()
    const buf = fs.readFileSync(filePath)
    form.append('file', buf, path.basename(filePath))
    return form
  }

  /**
   * Call the GET API.
   * @param api
   */
  async get<T>(api: string): Promise<T> {
    await this.cli.login()
    const resp: HttpResponse = await this.cli.request('GET', api)
    if (!resp.success) {
      throw new Error(`Call to GET ${api} failed: ${JSON.stringify(resp)}`)
    }
    return resp.data as unknown as T
  }

  /**
   * Call the GET UI API.
   * @param api
   */
  async getUi<T>(api: string): Promise<T> {
    await this.cli.login()
    const resp: HttpResponse = await this.cli.requestUi('GET', api)
    if (!resp.success) {
      throw new Error(`Call to GET UI ${api} failed: ${JSON.stringify(resp)}`)
    }
    return resp.data as unknown as T
  }

  /**
   * Call the DELETE API.
   * @param api
   */
  async delete<T>(api: string): Promise<T> {
    await this.cli.login()
    const resp: HttpResponse = await this.cli.request('DELETE', api)
    if (!resp.success) {
      throw new Error(`Call to DELETE ${api} failed: ${JSON.stringify(resp)}`)
    }
    return resp.data as unknown as T
  }

  /**
   * Call the DELETE API.
   * @param api
   */
  async deleteUi<T>(api: string, args: Record<string, any> | undefined = undefined): Promise<T> {
    await this.cli.login()
    const resp: HttpResponse = await this.cli.requestUi('DELETE', api, args)
    if (!resp.success) {
      throw new Error(`Call to DELETE UI ${api} failed: ${JSON.stringify(resp)}`)
    }
    return resp.data as unknown as T
  }

  /**
   * Call the PATCH API.
   * @param api
   */
  async patch<T>(api: string, data: FormData | Record<string, any>): Promise<T> {
    await this.cli.login()
    const resp: HttpResponse = await this.cli.request('PATCH', api, data)
    if (!resp.success) {
      throw new Error(`Call to PATCH ${api} failed: ${JSON.stringify(resp)}`)
    }
    return resp.data as unknown as T
  }

  /**
   * Call the POST API.
   * @param api
   */
  async post<T>(api: string, data: FormData | Record<string, any>): Promise<T> {
    await this.cli.login()
    const resp: HttpResponse = await this.cli.request('POST', api, data)
    if (!resp.success) {
      throw new Error(`Call to POST ${api} failed: ${JSON.stringify(resp)}`)
    }
    return resp.data as unknown as T
  }

  /**
   * Call the POST UI API.
   * @param api
   */
  async postUi<T>(api: string, data: FormData | Record<string, any>): Promise<T> {
    await this.cli.login()
    const resp: HttpResponse = await this.cli.requestUi('POST', api, data)
    if (!resp.success) {
      throw new Error(`Call to POST UI ${api} failed: ${JSON.stringify(resp)}`)
    }
    return resp.data as unknown as T
  }

  /**
   * An alternative POST call to upload file, when its path is known.
   * @param api
   * @param filePath
   * @returns
   */
  async postUpload<T>(api: string, filePath: FilePath): Promise<T> {
    const form = this.formForFile(filePath)
    return this.post(api, form)
  }

  /**
   * Download URL to a file.
   */
  async getDownload(api: string, filePath: FilePath): Promise<void> {
    await this.cli.login()
    const resp = await axios({
      url: `${this.cli.api}${api}`,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: {
        Authorization: `Bearer ${this.cli.token}`
      }
    })
    fs.writeFileSync(filePath, resp.data)
  }

  /**
   * Execute member function based on the given argument.
   */
  async runBy(op: string) {
    const cmd = this.args[op]
    if (!cmd) {
      this.help()
      return
    }
    if (typeof cmd !== 'string') {
      throw new Error(`Invalid operation argument ${JSON.stringify(cmd)}.`)
    }
    if (!this[cmd]) {
      console.log(this[cmd])
      throw new Error(`There is no member function '${cmd}' in command class '${this.constructor.name}'.`)
    }
    await this[cmd]()
  }

  /**
   * Ensure string argument.
   * @param arg
   */
  str(arg: CommandArgument): string {
    if (arg === null || arg === undefined) {
      return ''
    }
    if (typeof arg === 'string') {
      return arg
    }
    return arg[0]
  }

  /**
   * Ensure numeric argument.
   * @param arg
   */
  num(arg: CommandArgument): number {
    if (arg === null || arg === undefined) {
      return 0
    }
    return parseFloat(this.str(arg))
  }

  /**
   * Convert year, date or number to period ID.
   * @param arg
   */
  async periodId(db: CommandArgument, periodArg: CommandArgument): Promise<ID> {
    if (!db) {
      throw new Error(`Invalid database argument ${JSON.stringify(db)}`)
    }
    const period = this.str(periodArg)
    if (!period) {
      throw new Error(`Invalid period argument ${JSON.stringify(period)}`)
    }
    let periods: PeriodModelData[] = await this.get(`/db/${db}/period`)
    if (/^\d{4}$/.test(period)) {
      const date = `${period}-06-15`
      periods = periods.filter(p => p.start_date <= date && date <= p.end_date)
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
      periods = periods.filter(p => p.start_date <= period && period <= p.end_date)
    } else if (/^\d+$/.test(period)) {
      const id = parseInt(period)
      periods = periods.filter(p => p.id === id)
    } else {
      throw new Error(`Invalid period argument ${JSON.stringify(period)}`)
    }
    if (periods.length > 1) {
      throw new Error(`Too many periods match to ${JSON.stringify(period)}`)
    }
    if (!periods.length) {
      throw new Error(`No periods found matching ${JSON.stringify(period)}`)
    }
    return periods[0].id
  }

  /**
   * Ensure that there is only one period in the DB and return its ID.
   * @param dbArg
   * @returns
   */
  async singlePeriod(dbArg: CommandArgument): Promise<PeriodModelData> {
    const period: PeriodModelData[] = await this.get(`/db/${this.str(dbArg)}/period`)
    if (period.length < 1) {
      throw new Error('There are no periods in the database.')
    }
    if (period.length > 1) {
      throw new Error('There are too many periods in the database to set initial balance.')
    }
    return period[0]
  }

  /**
   * Read in accounts if not yet read.
   */
  async readAccounts(dbArg: CommandArgument): Promise<void> {
    if (!this.accounts) {
      this.accounts = {}
      this.accountsById = {}
      const accounts: AccountModelData[] = await this.get(`/db/${this.str(dbArg)}/account`)
      for (const account of accounts) {
        this.accounts[account.number] = account
        this.accountsById[account.id || 0] = account
      }
    }
  }

  /**
   * Verify that the given number is valid account and return its ID.
   * @param dbArg
   * @param accountArg
   */
  async accountId(dbArg: CommandArgument, accountArg: CommandArgument): Promise<ID> {
    await this.readAccounts(dbArg)
    const num = this.str(accountArg)
    if (!this.accounts[num]) {
      throw new Error(`No account found matching ${JSON.stringify(accountArg)}`)
    }
    return this.accounts[num].id
  }

  /**
   * Verify that argument is one or more entry descriptions.
   * @param entryArg
   */
  async entries(dbArg: CommandArgument, entryArg: CommandArgument): Promise<CommandEntryData[]> {
    if (!entryArg) {
      throw new Error(`Invalid entry argument ${JSON.stringify(entryArg)}.`)
    }
    const entry = typeof entryArg === 'string' ? [entryArg] : entryArg
    const ret: CommandEntryData[] = []
    for (const e of entry) {
      const match = /^\s*(\d+)\s+(.+?)\s+([-+]?\d+([,.]\d+)?)(\s+\{.*\})?$/.exec(e)
      if (!match) {
        throw new Error(`Invalid transaction line ${JSON.stringify(e)}`)
      }
      const amount = Math.round(parseFloat(match[3].replace(',', '.')) * 100)
      let data
      if (match[5]) {
        try {
          data = JSON.parse(match[5])
        } catch (e) {
          throw new Error(`Parsing JSON '${match[5]}' failed.`)
        }

      }

      ret.push({
        account_id: await this.accountId(dbArg, match[1]),
        number: match[1] as AccountNumber,
        amount,
        description: match[2],
        data
      })
    }
    return ret
  }

  /**
   * Verify that the argument is proper date.
   * @param date
   */
  date(dateArg: CommandArgument): ShortDate {
    const date = this.str(dateArg)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid date argument ${JSON.stringify(dateArg)}`)
    }
    return date
  }

  /**
   * Heuristically parse string to JSON value or string if not parseable.
   * @param value
   */
  value(value: CommandArgument): unknown {
    value = this.str(value)
    try {
      return JSON.parse(value)
    } catch (err) {
      return value
    }
  }

  /**
   * Parse either direct JSON data argument or read in file, if string starts with `@`.
   * @param data
   */
  async jsonData(dataArg: CommandArgument): Promise<Record<string, unknown>> {
    if (dataArg instanceof Array) {
      const ret = {}
      for (const data of dataArg) {
        Object.assign(ret, await this.jsonData(data))
      }
      return ret
    }
    if (!dataArg || typeof dataArg !== 'string') {
      throw new Error(`Invalid JSON data argument ${JSON.stringify(dataArg)}.`)
    }
    let data
    if (dataArg[0] === '@') {
      data = fs.readFileSync(dataArg.substring(1)).toString('utf-8')
    } else {
      data = dataArg
    }
    try {
      return JSON.parse(data)
    } catch (err) {
      throw new Error(`Failed to parse JSON ${data.substr(0, 1000)}.`)
    }
  }

  /**
   * Read in plugin data if not yet read and return info about the plugin.
   * @param pluginArg
   */
  async plugin(pluginArg: CommandArgument): Promise<TasenorPlugin|TasenorPlugin[]> {
    if (!this.plugins) {
      this.plugins = await this.getUi('/internal/plugins')
    }
    if (pluginArg instanceof Array) {
      const result: TasenorPlugin[] = []
      for (const plugin of pluginArg) {
        result.push(await this.plugin(plugin) as TasenorPlugin)
      }
      return result
    }
    const code = this.str(pluginArg)
    const plugin = this.plugins.filter(p => p.code === code)
    if (!plugin.length) {
      throw new Error(`Cannot find plugin '${code}'.`)
    }
    return plugin[0]
  }

  /**
   * Get the importer.
   * @param nameArg
   */
  async importer(dbArg: CommandArgument, nameArg: CommandArgument): Promise<ImporterModelData> {
    if (!this.importers) {
      this.importers = await this.get(`/db/${this.str(dbArg)}/importer`)
    }
    const name = this.str(nameArg)
    const importer = this.importers.filter(p => p.name === name)
    if (!importer.length) {
      throw new Error(`Cannot find importer '${name}'.`)
    }
    return importer[0]
  }

  /**
   * Find the named tag or throw an error.
   * @param name
   */
  async tag(db: CommandArgument, name: CommandArgument): Promise<TagModelData> {
    const resp: TagModelData[] = await this.get(`/db/${db}/tags`)
    const match = resp.filter(tag => tag.tag === name)
    if (!match.length) {
      throw new Error(`Cannot find a tag '${name}.`)
    }
    return match[0]
  }

  /**
   * Show help.
   */
  help() {
    const args = this.cli.originalArgs.concat(['-h'])
    this.cli.run([], args)
  }
}
