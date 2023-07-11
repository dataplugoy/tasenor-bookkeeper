import glob from 'fast-glob'
import path from 'path'
import fs from 'fs'
import { system } from '..'
import { log, BookkeeperConfig, DirectoryPath, Hostname, ProcessedTsvFileData, TarFilePath, TextFilePath, TsvFilePath, error, FilePath } from '@dataplug/tasenor-common'
import { DB, KnexDatabase } from './DB'
import { create } from 'ts-opaque'

/**
 * Implementation of the database backup file reading.
 */
export class BookkeeperImporter {

  VERSION: number | null = null

  /**
   * Read in a TSV-file and construct list of objects.
   * @param file Path to the TSV-file.
   * @returns List of objects using texts in header line as keys.
   */
  async readTsv(file: TsvFilePath): Promise<ProcessedTsvFileData> {
    log(`Reading ${file}.`)
    const content = fs.readFileSync(file).toString('utf-8').trim()
    const lines = content.split('\n').map(s => s.split('\t'))
    const headers = lines[0]
    headers[0] = headers[0].replace(/^#\s+/, '')
    const objects: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const obj = {}
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = lines[i][j] || ''
      }
      objects.push(obj)
    }
    return objects
  }

  /**
   * Read the version number from the file.
   * @param file Path to the version file.
   */
  setVersion(file: TextFilePath): void {
    this.VERSION = JSON.parse(fs.readFileSync(file).toString('utf-8'))
    log(`Found file format version ${this.VERSION}.`)
  }

  /**
   * Read the account information from the tsv file.
   * @param file A tsv file to read.
   */
  async readAccountTsv(file: TsvFilePath): Promise<any[]> {
    const match = /([a-z][a-z])-([A-Z][A-Z][A-Z])\.tsv$/.exec(file)
    if (!match) {
      throw new Error(`File name ${file} has not correct format.`)
    }
    const entries: any[] = []
    const [, language, currency] = match
    const accounts = await this.readTsv(file)
    let headings: any[] = []
    for (const account of accounts) {

      if (account.text !== '') {
        const code = (!account.code
          ? null
          : (
              // Allow numeric VAT as well.
              /^\d+(\.\d+)$/.test(account.code) ? account.code : account.code.replace(/^_+/, '')
            ))
        let data: Record<string, any>
        try {
          data = account.data === undefined || account.data === '' ? {} : JSON.parse(account.data)
        } catch (err) {
          throw new Error(`Parsing account data failed: ${account.data}.`)
        }
        if (code !== null) {
          data.code = code
        }

        // Verision 1.
        if (this.VERSION === 1) {
          const flags = new Set(account.flags ? account.flags.split(' ') : [])
          if (flags.has('FAVOURITE')) {
            data.favourite = true
          }
        }

        const entry = {
          language,
          currency,
          number: account['number / title'],
          name: account.text,
          type: account.type,
          data
        }
        if (headings.length) {
          for (const heading of headings) {
            heading.number = entry.number
            entries.push(heading)
          }
          headings = []
        }
        entries.push(entry)
      } else {
        const spaces = /^(_*)/.exec(account['number / title'])
        const entry = {
          text: account['number / title'].replace(/^_+/, ''),
          number: null,
          level: spaces ? spaces[1].length : 0
        }
        headings.push(entry)
      }
    }
    return entries
  }

  /**
   * Read the account information in to the database.
   * @param db Database connection.
   * @param files A list of files to read.
   */
  async setAccounts(db: KnexDatabase, files: TsvFilePath[]): Promise<void> {
    let count = 0
    for (const file of files) {
      const accounts = await this.readAccountTsv(file)
      for (const entry of accounts) {
        if (entry.text) {
          await db('heading').insert(entry).catch(err => {
            error(`Failed to insert a heading ${JSON.stringify(entry)}`)
            throw err
          })
        } else {
          await db('account').insert(entry).catch(err => {
            error(`Failed to insert an account ${JSON.stringify(entry)}`)
            throw err
          })
        }
        count++
      }
    }
    log(`Inserted ${count} rows to the database.`)
  }

  /**
   * Read the period information in to the database.
   * @param db Database connection.
   * @param file Path to the period file.
   */
  async setPeriods(db, file: TsvFilePath): Promise<void> {
    log(`Reading period file ${file}.`)
    let count = 0
    const periods = await this.readTsv(file)
    for (const period of periods) {
      const entry = {
        start_date: period.start,
        end_date: period.end,
        locked: period.flags === 'LOCKED'
      }
      await db('period').insert(entry)
      count++
    }
    log(`Inserted ${count} rows to the database.`)
  }

  /**
   * Read and store all documents and entries found from the TSV-file.
   * @param db Database connection.
   * @param file Path to the transaction file.
   * @param conf Database configuration.
   */
  async setEntries(db: KnexDatabase, file: TsvFilePath, conf: BookkeeperConfig): Promise<void> {
    log(`Reading entry file ${file}.`)
    let count = 0
    const periods = await db('period').select('id').orderBy('start_date')
    const periodMap = {}
    const accounts = await db('account').select('id', 'number').where({ language: conf.language })
    const accountMap = accounts.reduce((prev, cur) => ({ [cur.number]: cur.id, ...prev }), {})

    let n = 1
    for (const period of periods) {
      periodMap[n++] = period.id
    }
    const data = await this.readTsv(file)
    let periodId, docId, rowNumber
    for (const line of data) {
      // Period line.
      const check = /^Period (\d+)/.exec(line.number)
      if (check) {
        periodId = periodMap[parseInt(check[1])]
        if (!periodId) {
          throw Error(`Inconsistent periods. Cannot find period number ${n}.`)
        }
        continue
      }
      // Document line.
      if (line.number !== '') {
        const entry = {
          period_id: periodId,
          number: parseInt(line.number),
          date: line['date / account']
        }
        docId = (await db('document').insert(entry).returning('id'))[0].id
        count++
        rowNumber = 1
        continue
      }
      // Entry line.
      if (!accountMap[line['date / account']]) {
        throw Error(`Inconsistent accounts. Cannot account find number ${line['date / account']}.`)
      }
      const amount = parseFloat(line.amount)
      const data: Record<string, unknown> = {}

      // Version 1.
      if (this.VERSION === 1) {
        const flags = new Set(line.flags.split(' '))
        if (flags.has('VAT_IGNORE') || flags.has('VAT_RECONCILED')) {
          if (flags.has('VAT_IGNORE')) {
            data.VAT = { ignore: true }
          }
          if (flags.has('VAT_RECONCILED')) {
            data.VAT = { ...(data.VAT || {}), reconciled: true }
          }
        }
      // Version 2.
      } else if (this.VERSION === 2) {
        Object.assign(data, JSON.parse(line.data))
      }

      const entry = {
        document_id: docId,
        account_id: accountMap[line['date / account']],
        debit: !(amount < 0),
        amount: Math.abs(amount),
        description: line.text,
        row_number: rowNumber,
        data
      }
      rowNumber++
      await db('entry').insert(entry).catch(err => {
        error(`Failed to insert an entry ${JSON.stringify(entry)}`)
        throw err
      })
      count++
    }
    log(`Inserted ${count} rows to the database.`)
  }

  /**
   * Set the configuration for database.
   * @param db Database connection.
   * @param name Name of the database to update.
   * @param conf Database configuration.
   */
  async setConfig(db: KnexDatabase, config: BookkeeperConfig): Promise<void> {
    log('Saving configuration.')
    // Transform deep structures to dot-names.
    const transform = (config: object, prefix = ''): object => {
      const ret = {}
      Object.keys(config).forEach(k => {
        if (config[k] !== null && typeof config[k] === 'object' && config[k].length === undefined) {
          Object.assign(ret, transform(config[k], `${k}.`))
        } else {
          ret[`${prefix}${k}`] = config[k]
        }
      })
      return ret
    }
    // Save all.
    for (const [k, v] of Object.entries(transform(config))) {
      await db('settings').insert({ name: k, value: JSON.stringify(v) })
    }
  }

  /**
   * Read in tag data and files from the backup.
   * @param db Database connection.
   * @param file Path to the tag file. Also its directory is assumed where images can be found.
   */
  async setTags(db: KnexDatabase, file: TsvFilePath): Promise<void> {
    log(`Reading tag file ${file}.`)
    const picPath = path.dirname(file)
    let count = 0
    const tags = await this.readTsv(file)
    for (const tag of tags) {
      const pic = fs.readFileSync(path.join(picPath, tag.picture))
      const entry = {
        tag: tag.tag,
        name: tag.name,
        mime: tag.mime,
        picture: pic,
        type: tag.type,
        order: tag.order
      }
      await db('tags').insert(entry)
      count++
    }
    log(`Inserted ${count} rows to the database.`)
  }

  /**
   * Remove all data from all tables.
   * @param db Database connection.
   */
  async clearEverything(db: KnexDatabase): Promise<void> {
    log('Deleting all existing data.')
    await db('entry').del()
    await db('document').del()
    await db('account').del()
    await db('heading').del()
    await db('period').del()
    await db('tags').del()
    await db('settings').del()
  }

  /**
   * Clear the given database and restore everything from the directory.
   * @param masterDb Master DB connection.
   * @param dbName Name of the database to use.
   * @param out The directory containing unpacked backup.
   * @param hostOverride If set, use this hostname instead of the one in database, when connecting to target DB.
   */
  async restore(masterDb: KnexDatabase, dbName: string, out: DirectoryPath, hostOverride: Hostname | null = null): Promise<void> {
    const userDb = await DB.get(masterDb, create(dbName), hostOverride)

    this.setVersion(create(path.join(out, 'VERSION')))
    const conf = JSON.parse(fs.readFileSync(path.join(out, 'settings.json')).toString('utf-8'))
    if (!conf.language) {
      throw new Error('Configuration does not have language.')
    }
    await this.clearEverything(userDb)
    await this.setConfig(userDb, conf)
    const files = glob.sync(path.join(out, 'accounts', '*'))
    await this.setAccounts(userDb, files as FilePath[])
    const periodsPath = path.join(out, 'periods.tsv')
    await this.setPeriods(userDb, create(periodsPath))
    const entriesPath = path.join(out, 'entries.tsv')
    await this.setEntries(userDb, create(entriesPath), conf)
    const tagsPath = path.join(out, 'tags.tsv')
    await this.setTags(userDb, create(tagsPath))
  }

  /**
   * Clear the given database and restore everything from the directory.
   * @param masterDb Master DB connection.
   * @param dbName Name of the database to use.
   * @param out The directory containing unpacked backup.
   * @param hostOverride If set, use this hostname instead of the one in database, when connecting to target DB.
   */
  async run(masterDb: KnexDatabase, dbName: string, tarPath: TarFilePath, out: DirectoryPath, hostOverride: Hostname | null = null) {
    tarPath = create(path.resolve(tarPath))
    if (!fs.existsSync(tarPath)) {
      throw new Error(`Backup ${tarPath} does not exist.`)
    }
    await system(`cd "${out}" && tar xf "${tarPath}"`)
    await this.restore(masterDb, dbName, out, hostOverride)
    await system(`rm -fr "${out}"`)
  }
}
