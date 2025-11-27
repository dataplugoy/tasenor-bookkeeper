/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs'
import { KnexDatabase, LanguageBackendPlugin, data2csv } from '..'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { ReportOptions, ReportID, ReportFlagName, ReportItem, ReportQueryParams, ReportLine, AccountNumber, ReportColumnDefinition, PeriodModel, ReportFormat, Language, PK, ReportMeta, ReportData, ReportTotals, Report } from '@tasenor/common'
import { BackendPlugin } from './BackendPlugin'

dayjs.extend(quarterOfYear)

/**
 * A plugin providing one or more reports.
 */
export class ReportPlugin extends BackendPlugin {

  private formats: ReportID[]
  // Is set, allow this report only on DBs having those accounting schemes.
  protected schemes: Set<string> | undefined
  // Store translation plugin references.
  protected languagePlugins: Partial<Record<Language, LanguageBackendPlugin>>

  constructor(...formats: ReportID[]) {
    super()
    this.formats = formats
    this.languagePlugins = {}
    this.schemes = undefined
  }

  /**
   * Read in report structure file.
   */
  getReportStructure(id: ReportID, lang: Language) : ReportFormat | undefined {
    const path = this.filePath(`${id}-${lang}.tsv`)
    if (fs.existsSync(path)) {
      return fs.readFileSync(path).toString('utf-8') as ReportFormat
    } else {
      throw new Error(`Cannot find report definition ${id}-${lang}.tsv`)
    }
  }

  /**
   * Get the list of supported languages.
   */
  getLanguages(): Language[] {
    return []
  }

  /**
   * Check if the given report is provided by this plugin.
   * @param id
   */
  hasReport(id: ReportID) {
    return this.formats.includes(id)
  }

  /**
   * Get the list of report IDs.
   */
  getFormats(scheme: string|undefined = undefined): ReportID[] {
    if (this.schemes === undefined || scheme === undefined || this.schemes.has(scheme)) {
      return this.formats
    }
    return []
  }

  /**
   * Return UI option definitions for the given report.
   * @param id
   */
  getReportOptions(id: ReportID): ReportOptions {
    return {}
  }

  /**
   * Convert time stamp or Date to date string YYYY-MM-DD.
   * @param {Number} timestamp
   */
  time2str(timestamp) {
    if (timestamp === null) {
      return null
    }
    if (timestamp instanceof Date) {
      timestamp = timestamp.toISOString()
    }
    return timestamp.substr(0, 10)
  }

  /**
   * Construct rendering information from report flags
   * @param flags
   * @returns
   */
  flags2item(flags: ReportFlagName[]): ReportItem {
    const item: ReportItem = {}
    flags.forEach(flag => {
      if (flag) {
        switch (flag) {
          case 'NEW_PAGE':
            break
          case 'BREAK':
            item.break = true
            break
          case 'BOLD':
            item.bold = true
            break
          case 'ITALIC':
            item.italic = true
            break
          case 'DETAILS':
            item.accountDetails = true
            break
          case 'HIDE_TOTAL':
            item.hideTotal = true
            break
          case 'REQUIRED':
            item.required = true
            break
          default:
            throw new Error(`Cannot recognize report format flag '${flag}'.`)
        }
      }
    })
    return item
  }

  /**
   * Construct column definitions for the report.
   * @param id
   * @param entries
   * @param options
   */
  async getColumns(id: ReportID, entries: ReportData[], options: ReportOptions, settings: ReportMeta): Promise<ReportColumnDefinition[]> {
    if (!options.periods) {
      throw new Error(`Need option 'periods' to define columns in ${JSON.stringify(options)}`)
    }
    const columns: ReportColumnDefinition[] = options.periods.map((period) => {
      return {
        type: 'currency',
        name: 'period' + period.id,
        title: this.columnTitle(id, period, options)
      }
    })
    columns.unshift({
      name: 'title',
      title: '',
      type: 'name'
    })
    return columns
  }

  /**
   * Construct a title for a column.
   * @param id
   * @param period
   * @param options
   */
  columnTitle(id: ReportID, period: PeriodModel, options: ReportOptions): string {
    throw new Error(`Report plugin ${this.constructor.name} does not implement columnTitle().`)
  }

  /**
   * Force some options, if needed.
   * @returns
   */
  forceOptions(options: ReportQueryParams): ReportQueryParams {
    return {
      negateAssetAndProfit: false, // A flag to multiply by -1 entries from asset and profit types of accounts.
      addPreviousPeriod: false // A flag to define if the previous period should be displayed for comparison.
    }
  }

  /**
   * Optional extra SQL limitation for SQL used to gather raw data. See constructSqlQuery().
   */
  async extraSQLCondition(): Promise<string | null> {
    return null
  }

  /**
   * Construct a SQL for the report query.
   * @param db
   * @param options
   * @returns A knex query prepared.
   */
  async constructSqlQuery(db: KnexDatabase, options: ReportQueryParams, settings: ReportMeta) {
    // Construct value negator.
    let negateSql = '(CASE debit WHEN true THEN 1 ELSE -1 END)'
    if (options.negateAssetAndProfit) {
      negateSql += " * (CASE WHEN account.type IN ('ASSET', 'PROFIT') THEN 1 ELSE -1 END)"
    }

    // Find periods.
    const periodIds = [options.periodId]
    if (options.addPreviousPeriod) {
      const recentPeriods = await db.select('*').from('period').where('id', '<=', options.periodId + '').orderBy('end_date', 'desc').limit(2)
      if (recentPeriods.length > 1) {
        periodIds.push(recentPeriods[1].id)
      }
      options.periods = recentPeriods // Save periods for further reference.
    }

    // Build a query basics.
    let sqlQuery = db.select(
      'document.period_id AS periodId',
      'document.number AS documentId',
      'document.date',
      'account.name',
      'account.type',
      'account.number',
      db.raw(`CAST(ROUND(${negateSql} * entry.amount * 100) AS BIGINT) AS amount`),
      'account.data as accountData',
      'entry.description',
      'entry.data'
    )
      .from('entry')
      .leftJoin('account', 'account.id', 'entry.account_id')
      .leftJoin('document', 'document.id', 'entry.document_id')
      .whereIn('document.period_id', periodIds as PK[])

    // Limit by account, if given.
    if (options.accountId) {
      sqlQuery = sqlQuery.andWhere('account.id', '=', options.accountId)
    }

    // Add extras, if any.
    const extras = await this.extraSQLCondition()
    if (extras) {
      sqlQuery = sqlQuery.andWhere(db.raw(extras))
    }

    // Tune ordering.
    sqlQuery = (sqlQuery
      .orderBy('document.date')
      .orderBy('document.number')
      .orderBy('document.id')
      .orderBy('entry.row_number')
      .orderBy('entry.id'))

    return sqlQuery
  }

  /**
   * Scan string for `{...}` sub-strings and translate parts.
   */
  translate(text: string, lang: Language): string {
    let match
    do {
      match = /(\{(\d\d\d\d-\d\d-\d\d)\})/.exec(text)
      if (match) {
        if (!this.languagePlugins[lang]) {
          this.languagePlugins[lang] = this.catalog?.getLanguagePlugin(lang) as LanguageBackendPlugin | undefined
        }
        text = text.replace(match[1], this.languagePlugins[lang]?.date2str(match[2]) || match[2])
      } else {
        match = /(\{(.*?)\})/.exec(text)
        if (match) {
          text = text.replace(match[1], this.t(match[2], lang))
        }
      }
    } while (match)

    return text
  }

  /**
   * Construct a report data for the report.
   * @param db
   * @param id
   * @param options
   *
   * Resulting entries on data is an array of objects containing:
   * * `tab` Zero originating indentation number.
   * * `error` If true, this row has an error.
   * * `required` If true, this is always shown.
   * * `hideTotal` if true, do not show total.
   * * `bold` if true, show in bold.
   * * `italic` if true, show in italic.
   * * `bigger` if true, show in bigger font.
   * * `fullWidth` if set, the content in column index defined here is expanded to cover all columns.
   * * `useRemainingColumns` if set, extend this column index to use all the rest columns in the row.
   * * `accountDetails` if true, after this are summarized accounts under this entry.
   * * `isAccount` if true, this is an account entry.
   * * `needLocalization` if set, value should be localized, i.e. translated according to the language selected.
   * * `name` Title of the entry.
   * * `number` Account number if the entry is an account.
   * * `values` An object with entry for each column mapping name of the columnt to the value to display.
   */
  async renderReport(db: KnexDatabase, id: ReportID, options: ReportQueryParams = {}): Promise<Report> {

    // Add report forced options.
    Object.assign(options, this.forceOptions(options))

    // Collect settings.
    const settings = (await db('settings').where('name', 'like', `${this.code}.%`).orWhere({ name: 'companyName' }).orWhere({ name: 'companyCode' })).reduce((prev, cur) => ({ ...prev, [cur.name]: cur.value }), {})

    // Find tags.
    const settingName = `${this.code}.tagTypes`
    if (options.byTags && settings[settingName]) {
      const tags = await db('tags').select('id', 'tag', 'name', 'type', 'order').from('tags').whereIn('type', settings[settingName]).orderBy('order')
      settings.tags = tags
    } else {
      settings.tags = []
    }

    // Find the formatting text description, if it exist.
    options.format = this.getReportStructure(id, options.lang || 'en')

    // Prepare query.
    const q = this.constructSqlQuery(db, options, settings)
    let entries = await q as ReportData[]

    // Process big ints.
    for (const entry of entries) {
      entry.amount = parseInt(entry.amount + '')
    }

    // Apply query filtering.
    entries = this.doFiltering(id, entries, options, settings)

    // Construct columns.
    const columns: ReportColumnDefinition[] = await this.getColumns(id, entries, options as ReportOptions, settings)
    columns.forEach(column => {
      column.title = this.translate(column.title, options.lang || 'en')
    })

    // We have now relevant entries collected. Use plugin features next.
    let data = await this.preProcess(id, entries, options, settings, columns) as ReportLine[]
    data = await this.postProcess(id, data, options, settings, columns)
    const report = {
      format: id,
      columns,
      meta: {
        businessName: settings.companyName,
        businessId: settings.companyCode
      },
      data
    }

    // Do the final conversion, if necessary.
    if (options.csv) {
      return data2csv(report, options)
    }

    return report
  }

  /**
   * Filter out entries not matching to the report selected parameters.
   * @param id
   * @param entries
   * @param options
   * @param settings
   */
  doFiltering(id: ReportID, entries: ReportData[], options: ReportQueryParams, settings: ReportMeta) {
    let filter = (entry) => true

    if (options.quarter1) {
      filter = (entry) => dayjs(entry.date).quarter() <= 1
    } else if (options.quarter2) {
      filter = (entry) => dayjs(entry.date).quarter() <= 2
    } else if (options.quarter3) {
      filter = (entry) => dayjs(entry.date).quarter() <= 3
    } else if (options.month1) {
      filter = (entry) => dayjs(entry.date).month() <= 0
    } else if (options.month1) {
      filter = (entry) => dayjs(entry.date).month() <= 0
    } else if (options.month2) {
      filter = (entry) => dayjs(entry.date).month() <= 1
    } else if (options.month4) {
      filter = (entry) => dayjs(entry.date).month() <= 3
    } else if (options.month5) {
      filter = (entry) => dayjs(entry.date).month() <= 4
    } else if (options.month7) {
      filter = (entry) => dayjs(entry.date).month() <= 6
    } else if (options.month8) {
      filter = (entry) => dayjs(entry.date).month() <= 7
    } else if (options.month10) {
      filter = (entry) => dayjs(entry.date).month() <= 9
    } else if (options.month11) {
      filter = (entry) => dayjs(entry.date).month() <= 10
    }

    return entries.filter(filter)
  }

  /**
   * This function converts the list of relevant entries to the column report data.
   * @param id
   * @param entries
   * @param options
   * @param columns
   */
  async preProcess(id: ReportID, entries: ReportData[], options: ReportQueryParams, settings: ReportMeta, columns: ReportColumnDefinition[]): Promise<ReportLine[]> {
    throw new Error(`Report plugin ${this.constructor.name} does not implement preProcess().`)
  }

  /**
   * Do post processing for report data before sending it. By default, do translations.
   * @param id Report type.
   * @param data Calculated report data
   * @param options Report options.
   * @param settings System settings.
   * @param columns Column definitions.
   * @returns
   */
  async postProcess(id: ReportID, data: ReportLine[], options: ReportQueryParams, settings: ReportMeta, columns: ReportColumnDefinition[]): Promise<ReportLine[]> {
    data.forEach(item => {
      if ('needLocalization' in item && item.needLocalization && item.name) {
        item.name = this.translate(item.name, options.lang || 'en')
      }
    })
    return data
  }

  /**
   * A helper to combine final report from pre-processed material for reports using TSV text description file.
   * @param accountNumbers A set of all account numbers found.
   * @param accountNames A mapping from account numbers to their names.
   * @param columnNames A list of column names.
   * @param format A text description of the report.
   * @param totals A mapping from account numbers their total balance.
   * @returns
   */
  parseAndCombineReport(accountNumbers: AccountNumber[], accountNames: Record<AccountNumber, string>, columns: ReportColumnDefinition[], format: ReportFormat, totals: ReportTotals): ReportLine[] {
    const columnNames = columns.filter((col) => col.type === 'currency').map((col) => col.name)

    // Parse report and construct format.
    const allAccounts: AccountNumber[] = Array.from(accountNumbers).sort()
    const ret: ReportLine[] = []
    format.split('\n').forEach((line) => {
      if (/^#/.test(line)) {
        return
      }
      let [accNumbers, text, accFlags] = line.split('\t')
      const numbers = accNumbers.split(' ')
      const flags: Set<ReportFlagName> = accFlags ? new Set(accFlags.trim().split(/\s+/) as ReportFlagName[]) : new Set()
      const tab = text ? text.replace(/^(_*).*/, '$1').length : 0
      text = text ? text.replace(/^_+/, '') : ''

      if (flags.has('NEW_PAGE')) {
        ret.push({ pageBreak: true })
        return
      }

      if (flags.has('BREAK')) {
        ret.push({ paragraphBreak: true })
        return
      }

      // Split the line and reset variables.
      const values: Record<string, number | null> = {}
      columnNames.forEach((column) => (values[column] = null))
      let unused = true
      const item: ReportItem = { tab, ...this.flags2item([...flags]) }

      // Collect all totals inside any of the account number ranges.
      for (let i = 0; i < numbers.length; i++) {
        const parts = numbers[i].split('-')
        const from = parts[0]
        const to = parts[1]
        columnNames.forEach((column) => {
          allAccounts.forEach((number) => {
            if (number >= from && number < to) {
              unused = false
              if (totals[column][number] !== undefined) {
                values[column] = (values[column] || 0) + totals[column][number]
              }
            }
          })
        })
      }

      // If we actually show details we can skip this entry and fill details below.
      if (!item.accountDetails) {
        if (item.required || !unused) {
          item.name = text
          item.values = values
          ret.push(item)
        }
      }

      // Fill in account details for the entries wanting it.
      if (item.accountDetails) {
        for (let i = 0; i < numbers.length; i++) {
          const parts = numbers[i].split('-')
          const from = parts[0]
          const to = parts[1]
          allAccounts.forEach((number) => {
            if (number >= from && number < to) {
              const item = { tab, ...this.flags2item([...flags]) }
              item.isAccount = true
              delete item.accountDetails
              item.name = accountNames[number]
              item.number = number
              item.values = {}
              columnNames.forEach((column) => {
                if (!item.values) {
                  item.values = {}
                }
                if (totals[column][number] === undefined) {
                  item.values[column] = null
                } else {
                  item.values[column] = totals[column][number] + 0
                }
              })
              ret.push(item)
            }
          })
        }
      }
    })

    return ret
  }
}
