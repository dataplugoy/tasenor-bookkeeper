import path from 'path'
import fs from 'fs'
import { KnexDatabase } from '..'
import { log, ParsedTsvFileData, BookkeeperConfig, DirectoryPath, TsvFilePath, JsonFilePath, Json, Value, TarFilePath } from '@dataplug/tasenor-common'
import { create } from 'ts-opaque'
import { system } from '../system'
import dayjs from 'dayjs'

/**
 * Common functionality for exporters.
 */
export class Exporter {

  /**
   * Version number of the file format produced by this exporter.
   */
  VERSION: number = 2

  /**
   * Read all accounts from the database and generate TSV-data.
   * @param db Knex connection to use.
   * @returns
   */
  async getAccounts(db: KnexDatabase): Promise<ParsedTsvFileData> {
    throw new Error(`Exporter ${this.constructor.name} does not implement getAccounts().`)
  }

  /**
   * Read all periods from the database and generate TSV-data.
   * @param db Knex connection to use.
   * @returns
   */
  async getPeriods(db: KnexDatabase): Promise<ParsedTsvFileData> {
    throw new Error(`Exporter ${this.constructor.name} does not implement getPeriods().`)
  }

  /**
   * Read all entries and documents from the database and generate TSV-data.
   * @param db Knex connection to use.
   * @returns
   */
  async getEntries(db: KnexDatabase): Promise<ParsedTsvFileData> {
    throw new Error(`Exporter ${this.constructor.name} does not implement getEntries().`)
  }

  /**
   * Read configuration information from database and construct compiled configuration.
   * @param db Knex connection to use.
   * @returns
   */
  async getConfig(db: KnexDatabase): Promise<BookkeeperConfig> {
    throw new Error(`Exporter ${this.constructor.name} does not implement getConfig().`)
  }

  /**
   * Read all tags from the database and generate TSV-data.
   * @param db Knex connection to use.
   * @param out Directory to write image files.
   * @returns
   */
  async getTags(db: KnexDatabase, out: DirectoryPath): Promise<ParsedTsvFileData> {
    throw new Error(`Exporter ${this.constructor.name} does not implement getTags().`)
  }

  /**
   * Write prepared data to TSV file.
   * @param path Output file path.
   * @param lines Data content.
   */
  writeTsv(path: TsvFilePath, lines: ParsedTsvFileData): void {
    log(`Writing ${path}`)
    fs.writeFileSync(path, lines.map(l => l.join('\t')).join('\n') + '\n')
  }

  /**
   * Write prepared data to JSON file.
   * @param path Output file path.
   * @param lines Data content.
   */
  writeJson(path: JsonFilePath, data: Json): void {
    log(`Writing ${path}`)
    fs.writeFileSync(path, JSON.stringify(data, null, 4) + '\n')
  }

  /**
   * Save complete backup of the Sqlite database to the given directory.
   * @param db Database connection.
   * @param out Directory to store all files.
   * @returns Configuration constructed from the database.
   */
  async dump(db: KnexDatabase, out: DirectoryPath): Promise<BookkeeperConfig> {

    const accountDir = path.join(out, 'accounts')
    if (!fs.existsSync(accountDir)) {
      fs.mkdirSync(accountDir)
    }
    log(`Saving file format version ${this.VERSION}.`)
    this.writeJson(create(path.join(out, 'VERSION')), this.VERSION)
    const conf = await this.getConfig(db)
    this.writeJson(create(path.join(out, 'settings.json')), conf as unknown as Value)
    const accounts = await this.getAccounts(db)
    this.writeTsv(create(path.join(accountDir, 'fi-EUR.tsv')), accounts)
    const periods = await this.getPeriods(db)
    this.writeTsv(create(path.join(out, 'periods.tsv')), periods)
    const entries = await this.getEntries(db)
    this.writeTsv(create(path.join(out, 'entries.tsv')), entries)
    const tags = await this.getTags(db, out)
    this.writeTsv(create(path.join(out, 'tags.tsv')), tags)

    return conf
  }

  /**
   * Construct a tar-package for the given configuration from the source directory.
   * @param conf Configuration found from the database.
   * @param out Directory containing files extracted as a backup.
   * @param destPath Destionation file name if given.
   * @returns Path to the tar-package.
   */
  async makeTar(conf: BookkeeperConfig, out: DirectoryPath, destPath: DirectoryPath | undefined): Promise<TarFilePath> {
    const name = conf.companyName || 'unknown'
    const tar = `${name.replace(/[^-a-zA-Z0-9]/, '_')}-${dayjs().format('YYYY-MM-DD')}.tasenor`
    const tarPath = `${out}/../${tar}`
    const dest = process.cwd()
    if (!destPath) {
      destPath = create<DirectoryPath>(path.join(dest, tar))
    }
    if (path.dirname(destPath) === '.') {
      destPath = create<DirectoryPath>(path.join(dest, path.basename(destPath)))
    }
    await system(`cd "${out}" && tar cjf "${tarPath}" . && mv "${tarPath}" "${destPath}" && rm -fr ${out}`)
    log(`Package ready ${destPath}`)
    return destPath as unknown as TarFilePath
  }
}
