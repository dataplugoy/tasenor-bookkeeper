/* eslint-disable camelcase */
/**
 * Command line interface utilities.
 *
 * @module tasenor-common-node/src/cli
 */
import readline from 'readline'
import FormData from 'form-data'
import { ArgumentParser } from 'argparse'
import { HttpMethod, net, Url, Value, TokenPair, Token, log, HttpResponse, mute, waitPromise, note } from '@dataplug/tasenor-common'
import clone from 'clone'
import DbCommand from './commands/db'
import { Command, CommandArgumentDefault, CommandArguments } from './commands'
import AccountCommand from './commands/account'
import BalanceCommand from './commands/balance'
import EntryCommand from './commands/entry'
import ImportCommand from './commands/import'
import PeriodCommand from './commands/period'
import ImporterCommand from './commands/importer'
import PluginCommand from './commands/plugin'
import ReportCommand from './commands/report'
import SettingsCommand from './commands/settings'
import StockCommand from './commands/stock'
import TagCommand from './commands/tag'
import TxCommand from './commands/tx'
import UserCommand from './commands/user'

let readlineInterface

/**
 * Ask a question on the console and return answer.
 * @param question
 * @returns
 */
function ask(question: string): Promise<string> {
  if (!readlineInterface) {
    readlineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }
  return new Promise((resolve) => {
    readlineInterface.question(question ? `${question} ` : '>', (text) => { resolve(text) })
  })
}

/**
 * Exit hook that needs to be called if used functions in this library.
 */
function exit() {
  if (readlineInterface) readlineInterface.close()
}

/**
 * An interface for accessing API.
 */
export class CLIRunner {
  user: string
  password: string
  api: Url
  uiApi: Url
  token: Token
  commands: Record<string, Command>
  originalArgs: string[]
  args: CommandArguments

  /**
   * Execute HTTP request.
   * @param method
   * @param url
   * @returns
   */
  async request(method: HttpMethod, url: string, data: Value | undefined | FormData): Promise<HttpResponse> {
    const caller = net[method]
    const fullUrl: Url = url.startsWith('/') ? `${this.api}${url}` as Url : `${this.api}/${url}` as Url
    return this.doRequest(caller, fullUrl, data)
  }

  /**
   * Execute HTTP request against UI API.
   * @param method
   * @param url
   * @returns
   */
  async requestUi(method: HttpMethod, url: string, data: Value | undefined | FormData): Promise<HttpResponse> {
    const caller = net[method]
    const fullUrl: Url = url.startsWith('/') ? `${this.uiApi}${url}` as Url : `${this.uiApi}/${url}` as Url
    return this.doRequest(caller, fullUrl, data)
  }

  /**
   * Execute request with optional retries.
   * @param caller
   * @param fullUrl
   * @param data
   * @returns
   */
  async doRequest(caller, fullUrl, data) {
    let result: HttpResponse | null = null
    let error
    const max = this.args.retry || 0
    for (let i = -1; i < (max as number); i++) {
      try {
        result = await caller(fullUrl, data)
        if (result && result.success) {
          return result
        }
        error = new Error(JSON.stringify(result))
      } catch (err) {
        error = err
      }
      const delay = (i + 1) * 5
      note(`Waiting for ${delay} seconds`)
      await waitPromise(delay * 1000)
    }

    throw error
  }

  /**
   * Log in if we don't have access token yet.
   */
  async login(): Promise<void> {

    if (this.token) return

    log(`Logging in to ${this.api} as ${this.user}`)
    const resp = await this.request('POST', '/auth', { user: this.user, password: this.password })
    if (resp.success && resp.data && resp.data instanceof Object) {
      if ('token' in resp.data && 'refresh' in resp.data) {
        const { token, refresh } = resp.data
        this.configureApi(this.api, { token: token as Token, refresh: refresh as Token })
        this.configureApi(this.uiApi, { token: token as Token, refresh: refresh as Token })
        this.token = token as Token
      }
    }
  }

  /**
   * Set up the API.
   * @param tokens
   */
  configureApi(api: Url, tokens: TokenPair | undefined = undefined): void {
    net.configure({ sites: { [api]: {} } })
    if (tokens) {
      net.setConf(api, 'token', tokens.token)
      net.setConf(api, 'refreshToken', tokens.refresh)
    }
  }
}

/**
 * A class implementing dynamic collection of commands that are automatically looked up when called.
 */
export class CLI extends CLIRunner {

  /**
   * Scan commands and instantiate them to the collection.
   * @param paths
   */
  constructor() {
    super()

    this.commands = {
      account: new AccountCommand(this),
      db: new DbCommand(this),
      balance: new BalanceCommand(this),
      entry: new EntryCommand(this),
      import: new ImportCommand(this),
      importer: new ImporterCommand(this),
      period: new PeriodCommand(this),
      plugin: new PluginCommand(this),
      report: new ReportCommand(this),
      settings: new SettingsCommand(this),
      stock: new StockCommand(this),
      tag: new TagCommand(this),
      tx: new TxCommand(this),
      user: new UserCommand(this)
    }
  }

  /**
   * Insert defaults for the arguments.
   * @param args
   */
  addDefaults(defaults: CommandArgumentDefault[]) {
    for (const def of defaults) {
      const { name, envName, defaultValue } = def
      if (this.args[name] === undefined) {
        this.args[name] = process.env[envName] || defaultValue
      }
    }
  }

  /**
   * Parse and execute the command.
   */
  async run(defaults: CommandArgumentDefault[] = [], explicitArgs: string[] = []): Promise<void> {
    // Helper to extract arguments.
    const pop = (args: CommandArguments, name: string): string => {
      const ret = args[name]
      delete args[name]
      if (!ret) return ''
      return typeof ret === 'string' ? ret : ret[0]
    }

    const parser: ArgumentParser = new ArgumentParser({
      description: 'Tasenor command line tool'
    })

    parser.add_argument('command', { help: 'Command handling the operation', choices: Object.keys(this.commands) })
    parser.add_argument('--debug', '-d', { help: 'If set, show logs for requests etc', action: 'store_true', required: false })
    parser.add_argument('--json', { help: 'If set, show output as JSON', action: 'store_true', required: false })
    parser.add_argument('--verbose', '-v', { help: 'If set, show more comprehensive output', action: 'store_true', required: false })
    parser.add_argument('--user', { help: 'User email for logging in (use USERNAME env by default)', type: String, required: false })
    parser.add_argument('--password', { help: 'User password for logging in (use PASSWORD env by default)', type: String, required: false })
    parser.add_argument('--api', { help: 'The server base URL providing Bookkeeper API (use API env by default)', type: String, required: false })
    parser.add_argument('--ui-api', { help: 'The server base URL providing Bookkeeper UI API (use UI_API env by default)', type: String, required: false })
    parser.add_argument('--retry', { help: 'If given, retry this many times if network call fails', type: Number, required: false })

    // Set up args.
    this.originalArgs = explicitArgs.length ? clone(explicitArgs) : clone(process.argv.splice(2))

    // Find the command and add its arguments.
    let cmd: Command | undefined
    for (let i = 0; i < this.originalArgs.length; i++) {
      if (this.commands[this.originalArgs[i]]) {
        cmd = this.commands[this.originalArgs[i]]
        break
      }
    }

    if (cmd) {
      cmd.addArguments(parser)
    }

    // Collect and fix arguments.
    this.args = parser.parse_args(this.originalArgs)

    cmd?.setArgs(this.args)

    this.addDefaults(defaults)
    this.user = pop(this.args, 'user')
    this.password = pop(this.args, 'password')
    this.api = pop(this.args, 'api') as Url
    this.uiApi = pop(this.args, 'ui_api') as Url
    delete this.args.command
    if (!this.args.debug) {
      mute()
    }

    // Configure net APIs.
    if (this.api) {
      this.configureApi(this.api)
    }
    if (this.uiApi) {
      this.configureApi(this.uiApi)
    }

    cmd && await cmd.run()
  }
}

export const cli = {
  ask,
  exit
}
