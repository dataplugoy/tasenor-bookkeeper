import fs from 'fs'
import { data2csv } from '..'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import { ReportOptions, ReportID, ReportFlagName, ReportItem, ReportQueryParams, ReportLine, AccountNumber, ReportColumnDefinition, PeriodModel, ReportFormat, Language } from '@dataplug/tasenor-common'
import { BackendPlugin } from './BackendPlugin'

dayjs.extend(quarterOfYear)

/**
 * A plugin providing one or more reports.
 */
export class ReportPlugin extends BackendPlugin {

  private formats: ReportID[]
  // Is set, allow this report only on DBs having those accounting schemes.
  protected schemes: Set<string> | undefined

  constructor(...formats: ReportID[]) {
    super()
    this.formats = formats
    this.schemes = undefined
  }

  /**
   * Read in report struture file.
   */
  getReportStructure(id: ReportID, lang: Language) : ReportFormat | undefined {
    const path = this.filePath(`${id}-${lang}.tsv`)
    if (fs.existsSync(path)) {
      return fs.readFileSync(path).toString('utf-8') as ReportFormat
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
  hasReport(id) {
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
  getReportOptions(id): ReportOptions {
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
  flags2item(flags: ReportFlagName[]) {
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
  async getColumns(id, entries, options: ReportOptions, settings): Promise<ReportColumnDefinition[]> {
    if (!options.periods) {
      throw new Error(`Need periods to define columns ${JSON.stringify(options)}`)
    }
    const columns: ReportColumnDefinition[] = options.periods.map((period) => {
      return {
        type: 'numeric',
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
  forceOptions(options) {
    return {
      negateAssetAndProfit: false, // A flag to multiply by -1 entries from asset and profit types of accounts.
      addPreviousPeriod: false // A flag to define if the previous period should be displayed for comparison.
    }
  }

  /**
   * Construct a SQL for the report query.
   * @param db
   * @param options
   * @returns A knex query prepared.
   */
  async constructSqlQuery(db, options, settings) {
    // Construct value negator.
    let negateSql = '(CASE debit WHEN true THEN 1 ELSE -1 END)'
    if (options.negateAssetAndProfit) {
      negateSql += " * (CASE WHEN account.type IN ('ASSET', 'PROFIT') THEN 1 ELSE -1 END)"
    }

    // Find periods.
    const periodIds = [options.periodId]
    if (options.addPreviousPeriod) {
      const recentPeriods = await db.select('*').from('period').where('id', '<=', options.periodId).orderBy('end_date', 'desc').limit(2)
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
      'entry.description'
    )
      .from('entry')
      .leftJoin('account', 'account.id', 'entry.account_id')
      .leftJoin('document', 'document.id', 'entry.document_id')
      .whereIn('document.period_id', periodIds)

    // Limit by account, if given.
    if (options.accountId) {
      sqlQuery = sqlQuery.andWhere('account.id', '=', options.accountId)
    }

    // Tune ordering.
    sqlQuery = (sqlQuery
      .orderBy('document.date')
      .orderBy('document.number')
      .orderBy('document.id')
      .orderBy('entry.row_number'))

    return sqlQuery
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
   * * `needLocalization` if set, value should be localized, i.e. translated via Localization component in ui.
   * * `name` Title of the entry.
   * * `number` Account number if the entry is an account.
   * * `amounts` An object with entry for each column mapping name of the columnt to the value to display.
   */
  async renderReport(db, id, options: ReportQueryParams = {}) {

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
    const q = await this.constructSqlQuery(db, options, settings)
    let entries = await q

    // Process big ints.
    for (const entry of entries) {
      entry.amount = parseInt(entry.amount)
    }

    // Apply query filtering.
    entries = this.doFiltering(id, entries, options, settings)

    // We have now relevant entries collected. Use plugin features next.
    const columns: ReportColumnDefinition[] = await this.getColumns(id, entries, options as ReportOptions, settings)
    let data = this.preProcess(id, entries, options, settings, columns)
    data = this.postProcess(id, data, options, settings, columns)
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
  doFiltering(id, entries, options, settings) {
    let filter = (entry) => true

    if (options.quarter1) {
      filter = (entry) => dayjs(entry.date).quarter() <= 1
    } if (options.quarter2) {
      filter = (entry) => dayjs(entry.date).quarter() <= 2
    } if (options.quarter3) {
      filter = (entry) => dayjs(entry.date).quarter() <= 3
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
  preProcess(id, entries, options, settings, columns) {
    throw new Error(`Report plugin ${this.constructor.name} does not implement preProcess().`)
  }

  /**
   * Do post processing for report data before sending it.
   * @param id Report type.
   * @param data Calculated report data
   * @param options Report options.
   * @param settings System settings.
   * @param columns Column definitions.
   * @returns
   */
  postProcess(id, data, options, settings, columns) {
    return data
  }

  /**
   * A helper to combine final report from pre-processed material for reports using text description.
   * @param accountNumbers A set of all account numbers found.
   * @param accountNames A mapping from account numbers to their names.
   * @param columnNames A list of column names.
   * @param format A text description of the report.
   * @param totals A mapping from account numbers their total balance.
   * @returns
   */
  parseAndCombineReport(accountNumbers: AccountNumber[], accountNames, columns, format, totals) {
    const columnNames = columns.filter((col) => col.type === 'numeric').map((col) => col.name)

    // Parse report and construct format.
    const allAccounts: AccountNumber[] = Array.from(accountNumbers).sort()
    const ret: ReportLine[] = []
    format.split('\n').forEach((line) => {
      if (/^#/.test(line)) {
        return
      }
      let [numbers, text, flags] = line.split('\t')
      numbers = numbers.split(' ')
      flags = flags ? new Set(flags.trim().split(/\s+/)) : new Set()
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
      const amounts: Record<string, number | null> = {}
      columnNames.forEach((column) => (amounts[column] = null))
      let unused = true
      const item: ReportItem = { tab, ...this.flags2item(flags) }

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
                amounts[column] += totals[column][number]
              }
            }
          })
        })
      }

      // If we actually show details we can skip this entry and fill details below.
      if (!item.accountDetails) {
        if (item.required || !unused) {
          item.name = text
          item.amounts = amounts
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
              const item = { tab, ...this.flags2item(flags) }
              item.isAccount = true
              delete item.accountDetails
              item.name = accountNames[number]
              item.number = number
              item.amounts = {}
              columnNames.forEach((column) => {
                if (!item.amounts) {
                  item.amounts = {}
                }
                if (totals[column][number] === undefined) {
                  item.amounts[column] = null
                } else {
                  item.amounts[column] = totals[column][number] + 0
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
