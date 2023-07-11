import knex from 'knex'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import path from 'path'
import fs from 'fs'
import { KnexDatabase } from '..'
import { log, Bookkeeper, AccountType, ParsedTsvFileData, ShortDate, Timestamp, BookkeeperConfig, DirectoryPath, ReportFormat, TarFilePath, SqliteDbPath, Version, AccountNumber } from '@dataplug/tasenor-common'
import { Exporter } from './Exporter'

dayjs.extend(utc)

const VAT_IGNORE = 1
const VAT_RECONCILED = 2
const ACCOUNT_TYPES = Object.keys(AccountType)

// Helpers to convert nasty dates from original format.
function dateFromDb(date: Timestamp): ShortDate {
  const str = dayjs.utc(date).add(2, 'hours').format('YYYY-MM-DD')
  return str
}

/**
 * A class implementing conversion from old legacy Tilitin Sqlite-format to Tasenor format.
 */
export class TilitinExporter extends Exporter {

  /**
   * Construct Knex configuration for the given file.
   * @param path Path to the Sqlite-file.
   * @returns Instantiated Knex database connection.
   */
  database(path): KnexDatabase {
    return knex({
      client: 'sqlite3',
      connection: {
        filename: path
      },
      useNullAsDefault: true
    })
  }

  /**
   * Read all accounts from the database and generate TSV-data.
   * @param db Knex connection to use.
   * @returns
   */
  async getAccounts(db: KnexDatabase): Promise<ParsedTsvFileData> {
    const headings = {}
    for (const heading of await db('coa_heading').select('*').orderBy('level')) {
      headings[heading.number] = headings[heading.number] || []
      let tab = ''
      for (let i = 0; i < heading.level; i++) {
        tab += '_'
      }
      heading.text = tab + heading.text
      headings[heading.number].push(heading)
    }
    const lines = [['# number / title', 'text', 'type', 'code', 'data']]
    for (const account of await db('account').select('*').orderBy('number')) {
      if (headings[account.number]) {
        for (const heading of headings[account.number]) {
          lines.push([heading.text, '', '', '', '', ''])
        }
      }
      const data: Record<string, unknown> = {}
      if (account.flags) {
        data.favourite = true
      }
      lines.push([account.number, account.name, ACCOUNT_TYPES[account.type], account.vat_percentage || '', JSON.stringify(data)])
    }
    log(`Found ${lines.length} lines of data for headings and accounts.`)
    return lines
  }

  /**
   * Read all periods from the database and generate TSV-data.
   * @param db Knex connection to use.
   * @returns
   */
  async getPeriods(db: KnexDatabase): Promise<ParsedTsvFileData> {
    const lines = [['# start', 'end', 'flags']]
    for (const period of await db('period').select('*').orderBy('start_date')) {
      lines.push([dateFromDb(period.start_date), dateFromDb(period.end_date), period.locked ? 'LOCKED' : ''])
    }
    log(`Found ${lines.length} lines of data for periods.`)
    return lines
  }

  /**
   * Read all entries and documents from the database and generate TSV-data.
   * @param db Knex connection to use.
   * @returns
   */
  async getEntries(db: KnexDatabase): Promise<ParsedTsvFileData> {
    const lines = [['# number', 'date / account', 'amount', 'text', 'data']]
    let n = 1
    for (const period of await db('period').select('*').orderBy('start_date')) {
      lines.push([`Period ${n}`, '', '', '', ''])
      for (const doc of await db('document').select('*').where({ period_id: period.id }).orderBy('period_id', 'number')) {
        lines.push([doc.number, dateFromDb(doc.date), '', '', ''])
        for (const entry of await db('entry').join('account', 'entry.account_id', 'account.id').select('entry.*', 'account.number').where({ document_id: doc.id }).orderBy('row_number')) {

          const data: Record<string, unknown> = {}
          if (entry.flags & VAT_IGNORE) {
            data.VAT = { ignore: true }
          }
          if (entry.flags & VAT_RECONCILED) {
            data.VAT = { ...(data.VAT || {}), reconciled: true }
          }

          lines.push(['', entry.number, entry.debit ? entry.amount : -entry.amount, entry.description, JSON.stringify(data)])
        }
      }
      n++
    }
    log(`Found ${lines.length} lines of data for documents and entries.`)
    return lines
  }

  /**
   * Check if the given table exist.
   * @param db
   */
  async hasTable(db: KnexDatabase, table: string): Promise<boolean> {
    let hasTable = true
    try {
      await db(table).select('*').limit(1)
    } catch (err) {
      hasTable = false
    }
    return hasTable
  }

  /**
   * Read configuration information from database and construct compiled configuration.
   * @param db Knex connection to use.
   * @returns
   */
  async getConfig(db: KnexDatabase): Promise<BookkeeperConfig> {
    const conf: BookkeeperConfig = Bookkeeper.createConfig()
    conf.language = 'fi'
    conf.currency = 'EUR'
    conf.scheme = 'FinnishLimitedCompanyComplete'
    conf.schemeVersion = '1.0.0' as Version

    // Add VAT config if we have correct accounts.
    if (await db('account').select('*').where({ number: '29391' }).first()) {
      conf.VAT = {
        salesAccount: '29391' as AccountNumber,
        purchasesAccount: '29392' as AccountNumber,
        receivableAccount: '1763' as AccountNumber,
        payableAccount: '2939' as AccountNumber,
        delayedReceivableAccount: '1845' as AccountNumber,
        delayedPayableAccount: '2977' as AccountNumber,
        statementTagTypes: []
      }
    }

    for (const setting of await db('settings').select('name', 'business_id')) {
      conf.companyName = setting.name
      conf.companyCode = setting.business_id
    }
    if (await this.hasTable(db, 'fyffe_settings')) {
      for (const setting of await db('fyffe_settings').select('*')) {
        switch (setting.name) {
          case 'income-statement-tag-types':
            conf.FinnishIncomeStatementReport = { tagTypes: JSON.parse(setting.value) }
            break
          default:
            throw new Error(`Unable to parse setting '${setting.name}'`)
        }
      }
    }
    if (conf.VAT && conf.VAT.statementTagTypes && !conf.FinnishIncomeStatementReport) {
      conf.FinnishIncomeStatementReport = {
        tagTypes: conf.VAT.statementTagTypes
      }
    }

    return conf
  }

  /**
   * Read all tags from the database and generate TSV-data.
   * @param db Knex connection to use.
   * @param out Directory to write image files.
   * @returns
   */
  async getTags(db: KnexDatabase, out: DirectoryPath): Promise<ParsedTsvFileData> {
    const lines = [['# tag', 'name', 'mime', 'picture', 'type', 'order']]
    const picDir = path.join(out, 'pictures')
    if (!fs.existsSync(picDir)) {
      fs.mkdirSync(picDir)
    }
    if (await this.hasTable(db, 'tags')) {
      for (const tag of await db('tags').select('*').orderBy('order')) {
        const ext = tag.mime.split('/')[1]
        const file = `${tag.type}-${tag.order}.${ext}`
        fs.writeFileSync(path.join(picDir, file), tag.picture)
        lines.push([tag.tag, tag.name, tag.mime, path.join('pictures', file), tag.type, tag.order])
      }
    }
    log(`Found ${lines.length} lines of data for tags.`)
    return lines
  }

  /**
   * Read all report formats from the database and generate mapping from report IDs to report format.
   * @param db Knex connection to use.
   * @returns
   */
  async getReports(db: KnexDatabase): Promise<{ [key: string]: ReportFormat }> {
    const reports = {}
    for (const report of await db('report_structure').select('*')) {
      reports[report.id] = report.data
    }
    log(`Found reports ${Object.keys(reports)}.`)
    return reports
  }

  /**
   * Convert old report format to new.
   * @param report
   */
  convertReport(report: ReportFormat): ParsedTsvFileData {
    const lines: [string, string, string][] = [['# accounts', 'title', 'flags']]
    for (const line of report.trim().split('\n')) {
      let entries: [string, string, string[]]
      if (line === '') continue
      if (line === '-') {
        entries = ['', '', ['BREAK']]
      } else if (line === '--') {
        entries = ['', '', ['NEW_PAGE']]
      } else {
        const parts = line.split(';')
        const code = parts[0]
        let tab = ''
        for (let i = 0; i < parseInt(code[2]); i++) {
          tab += '_'
        }
        let flags: string[] = []
        switch (code[0]) {
          case 'H':
            flags = ['HIDE_TOTAL', 'REQUIRED']
            break
          case 'G':
            flags = ['HIDE_TOTAL']
            break
          case 'S':
            flags = ['REQUIRED']
            break
          case 'D':
            flags = ['DETAILS']
            break
          case 'T':
            break
          default:
            throw new Error(`Cannot parse letter ${code[0]} in report code ${code} of line ${line}.`)
        }
        switch (code[1]) {
          case 'B':
            flags.push('BOLD')
            break
          case 'I':
            flags.push('ITALIC')
            break
          case 'P':
            break
          default:
            throw new Error(`Cannot parse letter ${code[1]} in report code ${code} of line ${line}.`)
        }
        if (parts.length === 4) {
          entries = [`${parts[1]}-${parts[2]}`, tab + parts[3], flags]
        } else if (parts.length === 6) {
          entries = [`${parts[1]}-${parts[2]} ${parts[3]}-${parts[4]}`, tab + parts[5], flags]
        } else if (parts.length === 8) {
          entries = [`${parts[1]}-${parts[2]} ${parts[3]}-${parts[4]} ${parts[5]}-${parts[6]}`, tab + parts[7], flags]
        } else {
          throw new Error(`Unable to parse line ${line} since there are ${parts.length} parts.`)
        }
      }
      lines.push([entries[0], entries[1], entries[2].join(' ')])
    }
    return lines
  }

  /**
   * Run the full backup for the given legacy database.
   * @param sqlite Path to the Sqlite database to create backup for.
   * @param out Directory to save backup.
   * @param destPath Destionation file name if given.
   * @returns Path to the tar-package.
   */
  async run(sqlite: SqliteDbPath, out: DirectoryPath, destPath: DirectoryPath | undefined): Promise<TarFilePath> {
    if (!fs.existsSync(sqlite)) {
      throw new Error(`Database ${out} does not exist.`)
    }
    const db = this.database(sqlite)
    const conf = await this.dump(db, out)
    return this.makeTar(conf, out, destPath)
  }
}
