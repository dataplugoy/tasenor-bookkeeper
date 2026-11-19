/**
 * Pure helpers turning API responses into compact text for a language model.
 *
 * The API gives all money as integer cents (reports, balances and entries alike). Everything
 * leaving this server is converted to plain decimal euros with two decimals, so the model never
 * has to know about the unit.
 */

export interface Account {
  id: number
  number: string
  name: string
  type: string
  currency?: string
}

export interface Entry {
  id: number
  document_id: number
  account_id: number
  debit: boolean
  amount: number
  description: string
  row_number: number
}

export interface Document {
  id: number
  number: number
  date: string
  period_id: number
  entries: Entry[]
}

export interface ReportColumn {
  type: string
  name: string
  title: string
}

export interface ReportRow {
  tab?: number
  name?: string
  values?: Record<string, number | null>
  [key: string]: unknown
}

export interface Report {
  format: string
  meta?: Record<string, string>
  columns: ReportColumn[]
  data: ReportRow[]
}

/**
 * Format integer cents as euros, e.g. `-160588` → `-1605.88`.
 */
export function euros (cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return ''
  }
  return (cents / 100).toFixed(2)
}

/**
 * Render a report as one line per row, columns separated by ` | `, hierarchy by indentation.
 */
export function renderReport (report: Report): string {
  const lines: string[] = []
  if (report.meta?.businessName) {
    lines.push(`${report.meta.businessName}${report.meta.businessId ? ` (${report.meta.businessId})` : ''}`)
  }
  lines.push(`Report: ${report.format}. Amounts in euros.`)
  lines.push(report.columns.map(c => (c.title || c.name).replace(/^column-/, '')).join(' | '))
  for (const row of report.data) {
    const indent = '  '.repeat(row.tab || 0)
    const cells = report.columns.map(col => {
      if (col.type === 'currency') {
        return euros(row.values?.[col.name])
      }
      const value = col.type === 'name' ? row.name : row[col.name]
      return value === undefined || value === null ? '' : `${value}`
    })
    lines.push(indent + cells.join(' | ').replace(/( \| )+$/, ''))
  }
  return lines.join('\n')
}

/**
 * A query of digits is an account number prefix (`"4"` is every expense account, `"1910"` one
 * bank account); anything else is a case-insensitive part of the account name.
 */
export function accountMatches (account: Account, query: string): boolean {
  if (/^\d+$/.test(query)) {
    return account.number.startsWith(query)
  }
  return account.name.toLowerCase().includes(query.toLowerCase())
}

export interface EntryFilter {
  text?: string
  account?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
}

export interface EntryMatch {
  document: Document
  entry: Entry
  account: Account | undefined
}

/**
 * Find entries matching every given criterion.
 *
 * `text` matches the entry description case-insensitively, `account` as in `accountMatches`.
 * Amounts are absolute euros.
 */
export function findEntries (documents: Document[], accounts: Map<number, Account>, filter: EntryFilter): EntryMatch[] {
  const text = filter.text?.toLowerCase()
  const accountQuery = filter.account
  const matches: EntryMatch[] = []
  for (const document of documents) {
    const date = `${document.date}`.substring(0, 10)
    if (filter.dateFrom && date < filter.dateFrom) continue
    if (filter.dateTo && date > filter.dateTo) continue
    for (const entry of document.entries || []) {
      const account = accounts.get(entry.account_id)
      if (text && !entry.description.toLowerCase().includes(text)) continue
      if (accountQuery && !(account && accountMatches(account, accountQuery))) continue
      const amount = Math.abs(entry.amount) / 100
      if (filter.minAmount !== undefined && amount < filter.minAmount) continue
      if (filter.maxAmount !== undefined && amount > filter.maxAmount) continue
      matches.push({ document, entry, account })
    }
  }
  return matches
}

/**
 * One line per entry: where it is, which account, which side and how much.
 */
export function renderEntry (match: EntryMatch): string {
  const { document, entry, account } = match
  const acc = account ? `${account.number} ${account.name}` : `account id ${entry.account_id}`
  const side = entry.debit ? 'debit' : 'credit'
  return `#${document.number} (document id ${document.id}) ${`${document.date}`.substring(0, 10)} | ${acc} | ${side} ${euros(entry.amount)} | ${entry.description}`
}

/**
 * Totals of a set of entries. `net` is debit minus credit, which is positive for an expense or
 * an asset increase and negative for revenue.
 */
export function totals (matches: EntryMatch[]): { debit: number, credit: number, net: number } {
  let debit = 0
  let credit = 0
  for (const { entry } of matches) {
    if (entry.debit) {
      debit += entry.amount
    } else {
      credit += entry.amount
    }
  }
  return { debit, credit, net: debit - credit }
}

/**
 * Render a whole document with its entries.
 */
export function renderDocument (document: Document, accounts: Map<number, Account>): string {
  const lines = [`Document #${document.number} (id ${document.id}), ${`${document.date}`.substring(0, 10)}, period id ${document.period_id}`]
  for (const entry of document.entries || []) {
    lines.push('  ' + renderEntry({ document, entry, account: accounts.get(entry.account_id) }).split(' | ').slice(1).join(' | '))
  }
  const sum = totals(document.entries.map(entry => ({ document, entry, account: undefined })))
  lines.push(`  Total debit ${euros(sum.debit)}, credit ${euros(sum.credit)}${sum.net === 0 ? '' : ' — NOT BALANCED'}`)
  return lines.join('\n')
}

export interface Draft {
  id: number
  period_id: number
  date: string
  description: string
  entries: { account_id: number, debit: boolean, amount: number, description?: string }[]
  data?: { source?: string, note?: string, [key: string]: unknown }
  created_by: string
  created: string
}

/**
 * An entry as the model proposes it: an account number and exactly one of debit or credit in euros.
 */
export interface ProposedEntry {
  account: string
  debit?: number
  credit?: number
  description?: string
}

/**
 * Turn proposed entries into the API's form (account ids, cents), checking everything the model
 * is likely to get wrong so it gets a precise message back instead of a generic API refusal.
 */
export function buildDraftEntries (entries: ProposedEntry[], accounts: Map<number, Account>): Draft['entries'] {
  const byNumber = new Map(Array.from(accounts.values()).map(a => [a.number, a]))
  const result: Draft['entries'] = []
  let debit = 0
  let credit = 0
  entries.forEach((entry, index) => {
    const row = `Entry ${index + 1}`
    const account = byNumber.get(`${entry.account}`.trim())
    if (!account) {
      throw new Error(`${row}: no account number ${entry.account}. Use list_accounts to find it.`)
    }
    const hasDebit = entry.debit !== undefined && entry.debit !== null
    const hasCredit = entry.credit !== undefined && entry.credit !== null
    if (hasDebit === hasCredit) {
      throw new Error(`${row}: give exactly one of debit or credit.`)
    }
    const euros = (hasDebit ? entry.debit : entry.credit) as number
    const cents = Math.round(euros * 100)
    if (!(cents > 0) || Math.abs(euros * 100 - cents) > 1e-6) {
      throw new Error(`${row}: the amount must be positive euros with at most two decimals, not ${euros}.`)
    }
    if (hasDebit) {
      debit += cents
    } else {
      credit += cents
    }
    result.push({ account_id: account.id, debit: hasDebit, amount: cents, ...(entry.description ? { description: entry.description } : {}) })
  })
  if (result.length < 2) {
    throw new Error('A document needs at least two entries.')
  }
  if (debit !== credit) {
    throw new Error(`Debits ${(debit / 100).toFixed(2)} and credits ${(credit / 100).toFixed(2)} do not match (difference ${((debit - credit) / 100).toFixed(2)}).`)
  }
  return result
}

export function renderDraft (draft: Draft, accounts: Map<number, Account>): string {
  const lines = [`Draft ${draft.id}: ${`${draft.date}`.substring(0, 10)} ${draft.description} (period id ${draft.period_id}, by ${draft.created_by}${draft.data?.source ? ` via ${draft.data.source}` : ''})`]
  if (draft.data?.note) {
    lines.push(`  Note: ${draft.data.note}`)
  }
  for (const entry of draft.entries) {
    const account = accounts.get(entry.account_id)
    const acc = account ? `${account.number} ${account.name}` : `account id ${entry.account_id}`
    lines.push(`  ${acc} | ${entry.debit ? 'debit' : 'credit'} ${euros(entry.amount)} | ${entry.description || draft.description}`)
  }
  return lines.join('\n')
}
