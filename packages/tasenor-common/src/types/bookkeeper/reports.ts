import Opaque from 'ts-opaque'
import { AccountData, AccountNumber, AccountType, PeriodModel } from '.'
import { Language, PK } from '../common'
import { AdditionalTransferInfo, ShortDate } from '..'

/**
 * Rendering hints for alliwing selection of report options in UI.
 */
export type ReportWidgetType = 'boolean'| 'boolean:true'| 'radio:1' | 'radio:1' | 'radio:1' | 'radio:1:default'

/**
 * Various options to adjust report display.
 *
 * `byTags`- Split report to columns per configured tags.
 * `compact`- If available, use compact format.
 * `month1`- Radio button for selecting Jan only.
 * `month2`- Radio button for selecting Feb only.
 * `quarter1`- Radio button for selecting Q1 only.
 * `month4`- Radio button for selecting Apr only.
 * `month5`- Radio button for selecting May only.
 * `quarter2`- Radio button for selecting Q2 only.
 * `month7`- Radio button for selecting Jul only.
 * `month8`- Radio button for selecting Aug only.
 * `quarter3`-Radio button for selecting Q3 only.
 * `month10`- Radio button for selecting Sep only.
 * `month11`- Radio button for selecting Oct only.
 * `full`- Radio button for selecting Q4, i.e. full year.
 *
 */
export interface ReportOptions {
  byTags?: 'boolean'
  compact?: 'boolean:true'
  quarter1?: 'radio:1',
  quarter2?: 'radio:1',
  quarter3?: 'radio:1',
  full?: 'radio:1:default',
  month1?: 'radio:1',
  month2?: 'radio:1',
  month4?: 'radio:1',
  month5?: 'radio:1',
  month7?: 'radio:1',
  month8?: 'radio:1',
  month10?: 'radio:1',
  month11?: 'radio:1',
  periods?: PeriodModel[]
}

/**
 * String identifier for the report type.
 */
export type ReportID = Opaque<string, 'ReportID'>
export function isReportID(s: unknown): s is ReportID {
  return typeof s === 'string' && /^[-a-z]+$/.test(s)
}

/**
 * TSV text data desription of the report format.
 */
export type ReportFormat = Opaque<string, 'ReportFormat'>

/**
 * Names of the flags usable as an option in a report line.
 */
export type ReportFlagName = 'NEW_PAGE' | 'BREAK' | 'BOLD' | 'ITALIC' | 'DETAILS' | 'HIDE_TOTAL' | 'REQUIRED'

/**
 * Raw data produced by the SQL query for further processing.
 */
export interface ReportData {
  periodId: PK
  documentId: PK
  date: ShortDate
  name: string
  type: AccountType
  number: AccountNumber
  accountData: AccountData
  amount: number
  description: string
  data: AdditionalTransferInfo
}

/**
 * Formatting instructions for one content line of the report.
 *
 * `accountDetails` - If true, after this there are separate lines for each account involved.
 * `values` - A mapping from column names to the numerical or string content (or just dash if null).
 * `bigger` - if true, show in bigger font.
 * `bold` - Use bold font.
 * `break` - A short empty line.
 * `error` - If true, this row has an error.
 * `fullWidth` - If true, this line is filling all columns.
 * `hideTotal` - Leave total column empty if we have total column.
 * `isAccount` - If true, this line maps directly to the account via number field aboce.
 * `italic` - Use italic font.
 * `name` - Name of the column. Used as a key when accessing column date.
 * `needLocalization` - If set, value should be localized, i.e. translated via Localization component in ui.
 * `number` - Account number if relevant.
 * `required` - If true, this line is always shown even if no values available for that item.
 * `tab` - A number starting from zero denoting indentation level of the line.
 * `useRemainingColumns` If set, extend this column index to use all the rest columns in the row.
 */
export interface ReportItem {
  id?: string
  accountDetails?: boolean
  values?: Record<string, string | number | null>
  bigger?: boolean
  bold?: boolean
  break?: boolean
  error?: boolean
  fullWidth?: boolean
  hideTotal?: boolean
  isAccount?: boolean
  italic?: boolean
  name?: string
  needLocalization?: boolean
  number?: AccountNumber
  required?: boolean
  tab?: number
  useRemainingColumns?: boolean
}

export function isReportItem(obj: unknown): obj is ReportItem {
  if (typeof obj !== 'object' && obj === null) return false
  if ('pageBreak' in (obj as Record<string, unknown>)) return false
  if ('paragraphBreak' in (obj as Record<string, unknown>)) return false
  return true
}

/**
 * A definition of a column in a report.
 *
 * `width`- Relative width of the column from 1..10.
 */
export interface ReportColumnDefinition {
  type: 'id' | 'name' | 'numeric' | 'currency' | 'text'
  name: string
  title: string
  width?: number
}

/**
 * An item denoting a page break in a printed report and wider vertical space on screen.
 */
export type ReportLinePageBreak = { pageBreak: true }

/**
 * An item denoting a paragraph break in a report.
 */
export type ReportLineParagrapBreak = { paragraphBreak: true }

/**
 * A single line of the report description.
 */
export type ReportLine = ReportItem | ReportLinePageBreak | ReportLineParagrapBreak

/**
 * Meta data for report.
 */
export interface ReportMeta {
  businessName: string
  businessId: string
  tags?: string[]
}

/**
 * Value summary for report processing keeping totals per column name per account.
 */
export type ReportTotals = Record<string, Record<AccountNumber, number>>

/**
 * A complete report data.
 */
export type Report = {
  format: ReportID
  columns: ReportColumnDefinition[]
  meta: ReportMeta
  data: ReportLine[]
}

/**
 * Possible query parameters that can be given to the report generator.
 */
export interface ReportQueryParams {
  format?: ReportFormat
  periodId?: PK
  periods?: PK[]
  accountId?: PK
  lang?: Language
  quarter1?: boolean
  quarter2?: boolean
  quarter3?: boolean
  month1?: boolean,
  month2?: boolean,
  month4?: boolean,
  month5?: boolean,
  month7?: boolean,
  month8?: boolean,
  month10?: boolean,
  month11?: boolean,
  compact?: boolean
  byTags?: boolean
  csv?: boolean
  dropTitle?: boolean
  negateAssetAndProfit?: boolean
  addPreviousPeriod?: boolean
}
