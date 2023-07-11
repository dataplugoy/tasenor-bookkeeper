import { Bookkeeper, BookkeeperConfig, DirectoryPath, log, ParsedTsvFileData, TarFilePath, Url } from '@dataplug/tasenor-common'
import { DB, KnexDatabase } from '../database'
import { Exporter } from './Exporter'
import knex from 'knex'
import dot from 'dot-object'
import path from 'path'
import fs from 'fs'

/**
 * Export Tasenor database.
 */
export class TasenorExporter extends Exporter {

  /**
   * Read configuration information from database and construct compiled configuration.
   * @param db Knex connection to use.
   * @returns
   */
  async getConfig(db: KnexDatabase): Promise<BookkeeperConfig> {
    const conf: BookkeeperConfig = Bookkeeper.createConfig()
    const settings = {}
    for (const setting of await db('settings').select('*')) {
      settings[setting.name] = setting.value
    }
    Object.assign(conf, dot.object(settings))
    return conf
  }

  /**
   * Read all accounts from the database and generate TSV-data.
   * @param db Knex connection to use.
   * @returns
   */
  async getAccounts(db: KnexDatabase): Promise<ParsedTsvFileData> {
    const headings = {}
    for (const heading of await db('heading').select('*').orderBy('level')) {
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
      const code = account.data.code || ''
      delete account.data.code
      lines.push([account.number, account.name, account.type, code, JSON.stringify(account.data)])
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
      lines.push([period.start_date, period.end_date, period.locked ? 'LOCKED' : ''])
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
        lines.push([doc.number, doc.date, '', '', ''])
        for (const entry of await db('entry').join('account', 'entry.account_id', 'account.id').select('entry.*', 'account.number').where({ document_id: doc.id }).orderBy('row_number')) {
          lines.push(['', entry.number, entry.debit ? entry.amount : -entry.amount, entry.description, JSON.stringify(entry.data)])
        }
      }
      n++
    }
    log(`Found ${lines.length} lines of data for documents and entries.`)
    return lines
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
    for (const tag of await db('tags').select('*').orderBy('order')) {
      const ext = tag.mime.split('/')[1]
      const file = `${tag.type}-${tag.order}.${ext}`
      fs.writeFileSync(path.join(picDir, file), tag.picture)
      lines.push([tag.tag, tag.name, tag.mime, path.join('pictures', file), tag.type, tag.order])
    }
    log(`Found ${lines.length} lines of data for tags.`)
    return lines
  }

  /**
   * Run the full backup for the given database.
   * @param dbUrl Database URL.
   * @param out Directory to save backup.
   * @param destPath Destionation file name if given.
   * @returns Path to the tar-package.
   */
  async run(dbUrl: Url, out: DirectoryPath, destPath: DirectoryPath | undefined = undefined): Promise<TarFilePath> {
    const db = DB.getKnexConfig(dbUrl)
    const conf = await this.dump(knex(db), out)
    return this.makeTar(conf, out, destPath)
  }

  /**
   * Run the full backup for the given database.
   * @param db Knex database.
   * @param out Directory to save backup.
   * @param destPath Destionation file name if given.
   * @returns Path to the tar-package.
   */
  async runDb(db: KnexDatabase, out: DirectoryPath, destPath: DirectoryPath | undefined = undefined): Promise<TarFilePath> {
    const conf = await this.dump(db, out)
    return this.makeTar(conf, out, destPath)
  }
}
