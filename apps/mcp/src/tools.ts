/**
 * The MCP tools. All are read-only except the draft tools, and a draft is never booked by this
 * server: there is deliberately no confirm tool, so a person has to confirm every draft in
 * Bookkeeper's own UI.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { ApiError, BookkeeperApi } from './api'
import { Account, Document, Draft, Report, accountMatches, buildDraftEntries, euros, findEntries, renderDocument, renderDraft, renderEntry, renderReport, totals } from './format'

interface Period {
  id: number
  start_date: string
  end_date: string
  locked: boolean
}

interface Balance {
  id: number
  number: string
  name: string
  debit: number
  credit: number
  total: number
}

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }

const COLUMNS = ['full', 'quarter1', 'quarter2', 'quarter3', 'month1', 'month2', 'month4', 'month5', 'month7', 'month8', 'month10', 'month11'] as const

const db = z.string().describe('Database name, from list_databases.')
const period = z.number().int().describe('Period id, from list_periods.')

function text (value: string) {
  return { content: [{ type: 'text' as const, text: value }] }
}

function failure (err: unknown) {
  const message = err instanceof ApiError || err instanceof Error ? err.message : `${err}`
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true }
}

/**
 * Wrap a handler so that API errors come back to the model as tool errors it can act on.
 */
function safe<A> (fn: (args: A) => Promise<string>) {
  return async (args: A) => {
    try {
      return text(await fn(args))
    } catch (err) {
      return failure(err)
    }
  }
}

export interface ToolOptions {
  // Leave out the draft tools entirely.
  readOnly?: boolean
  // Recorded on drafts as their source, e.g. the OAuth client's name.
  source?: string
}

export function registerTools (server: McpServer, api: BookkeeperApi, options: ToolOptions = {}): void {
  // Accounts rarely change and are needed to label every entry, so keep them for a minute.
  const accountCache = new Map<string, { at: number, accounts: Map<number, Account> }>()
  async function accounts (dbName: string): Promise<Map<number, Account>> {
    const cached = accountCache.get(dbName)
    if (cached && Date.now() - cached.at < 60_000) {
      return cached.accounts
    }
    const list = await api.get<Account[]>(`/db/${encodeURIComponent(dbName)}/account`)
    const map = new Map(list.map(a => [a.id, a]))
    accountCache.set(dbName, { at: Date.now(), accounts: map })
    return map
  }

  async function documents (dbName: string, periodId: number): Promise<Document[]> {
    return api.get<Document[]>(`/db/${encodeURIComponent(dbName)}/document`, { period: `${periodId}`, entries: '' })
  }

  server.registerTool('list_databases', {
    title: 'List bookkeeping databases',
    description: 'List the bookkeeping databases (one per company) this user can access.',
    inputSchema: {},
    annotations: READ_ONLY
  }, safe(async () => {
    const dbs = await api.get<{ name: string }[]>('/db')
    return dbs.length ? dbs.map(d => d.name).join('\n') : 'No databases.'
  }))

  server.registerTool('list_periods', {
    title: 'List accounting periods',
    description: 'List the accounting periods (fiscal years) of a database, newest first. Locked periods are closed and can no longer change.',
    inputSchema: { db },
    annotations: READ_ONLY
  }, safe(async ({ db }) => {
    const periods = await api.get<Period[]>(`/db/${encodeURIComponent(db)}/period`)
    return periods.map(p => `id ${p.id}: ${p.start_date} — ${p.end_date}${p.locked ? ' (locked)' : ''}`).join('\n') || 'No periods.'
  }))

  server.registerTool('list_accounts', {
    title: 'List accounts',
    description: 'List the chart of accounts. Without `search` this is the full chart, which can be hundreds of accounts; prefer get_balances to see only the accounts in use.',
    inputSchema: {
      db,
      search: z.string().optional().describe('Digits are an account number prefix (e.g. "19" for cash and bank); anything else matches part of the account name, case-insensitive.')
    },
    annotations: READ_ONLY
  }, safe(async ({ db, search }) => {
    let list = Array.from((await accounts(db)).values())
    if (search) {
      list = list.filter(a => accountMatches(a, search))
    }
    list.sort((a, b) => a.number.localeCompare(b.number))
    return list.map(a => `${a.number} ${a.name} (${a.type})`).join('\n') || 'No matching accounts.'
  }))

  server.registerTool('get_balances', {
    title: 'Get account balances',
    description: 'Closing balance of every account that has entries in the period, with debit and credit totals. Assets and expenses are normally positive, liabilities, equity and revenue negative.',
    inputSchema: { db, period },
    annotations: READ_ONLY
  }, safe(async ({ db, period }) => {
    const result = await api.get<Period & { balances: Balance[] }>(`/db/${encodeURIComponent(db)}/period/${period}`)
    const lines = [`Period ${result.start_date} — ${result.end_date}${result.locked ? ' (locked)' : ''}. Amounts in euros.`, 'account | debit | credit | balance']
    for (const b of result.balances) {
      lines.push(`${b.number} ${b.name} | ${euros(b.debit)} | ${euros(-b.credit)} | ${euros(b.total)}`)
    }
    return lines.join('\n')
  }))

  server.registerTool('get_report', {
    title: 'Get a financial report',
    description: 'Render a report for a period, compared with the previous period. Usual formats: income-statement, income-statement-detailed, balance-sheet, balance-sheet-detailed, general-journal, general-ledger. The available formats depend on the company; an unknown one returns the list.',
    inputSchema: {
      db,
      period,
      format: z.string().describe('Report format, e.g. "income-statement".'),
      column: z.enum(COLUMNS).optional().describe('Restrict to the period start up to the end of this quarter or month instead of the full period. Default "full".'),
      by_tags: z.boolean().optional().describe('Split the income statement by tags (cost centres), where supported.'),
      lang: z.enum(['en', 'fi', 'sv']).optional().describe('Report language. Default "en".')
    },
    annotations: READ_ONLY
  }, safe(async ({ db, period, format, column, by_tags: byTags, lang }) => {
    const query: Record<string, string | boolean | undefined> = { lang: lang || 'en', byTags }
    if (column && column !== 'full') {
      query[column] = true
    }
    try {
      const report = await api.get<Report>(`/db/${encodeURIComponent(db)}/report/${encodeURIComponent(format)}/${period}`, query)
      return renderReport(report)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        const { options } = await api.get<{ options: Record<string, unknown> }>(`/db/${encodeURIComponent(db)}/report`)
        throw new Error(`${err.message} Available formats: ${Object.keys(options).join(', ')}.`)
      }
      throw err
    }
  }))

  server.registerTool('get_account_ledger', {
    title: 'Get an account ledger',
    description: 'Every transaction on one account in a period, with the running balance.',
    inputSchema: {
      db,
      period,
      account: z.string().describe('Account number, e.g. "1910".')
    },
    annotations: READ_ONLY
  }, safe(async ({ db, period, account }) => {
    const found = Array.from((await accounts(db)).values()).filter(a => a.number === account)
    if (!found.length) {
      throw new Error(`No account number ${account}. Use list_accounts to find it.`)
    }
    const report = await api.get<Report>(`/db/${encodeURIComponent(db)}/report/general-ledger/${period}/${found[0].id}`, { lang: 'en' })
    return `${found[0].number} ${found[0].name}\n${renderReport(report)}`
  }))

  server.registerTool('search_entries', {
    title: 'Search entries',
    description: 'Find transaction entries in a period by description text, account, date range and amount. Returns the matching entries and their debit, credit and net (debit − credit) totals, so it also answers "how much did we spend on X".',
    inputSchema: {
      db,
      period,
      text: z.string().optional().describe('Text in the entry description, case-insensitive.'),
      account: z.string().optional().describe('Digits are an account number prefix (e.g. "4" for all expenses); anything else matches part of the account name.'),
      date_from: z.string().optional().describe('First date, YYYY-MM-DD.'),
      date_to: z.string().optional().describe('Last date, YYYY-MM-DD.'),
      min_amount: z.number().optional().describe('Minimum absolute amount in euros.'),
      max_amount: z.number().optional().describe('Maximum absolute amount in euros.'),
      limit: z.number().int().positive().max(1000).optional().describe('Most entries to list. Default 100; totals always cover every match.')
    },
    annotations: READ_ONLY
  }, safe(async ({ db, period, text, account, date_from: dateFrom, date_to: dateTo, min_amount: minAmount, max_amount: maxAmount, limit }) => {
    const [docs, accs] = await Promise.all([documents(db, period), accounts(db)])
    const matches = findEntries(docs, accs, { text, account, dateFrom, dateTo, minAmount, maxAmount })
    const max = limit || 100
    const sum = totals(matches)
    const lines = [
      `${matches.length} matching entries. Total debit ${euros(sum.debit)}, credit ${euros(sum.credit)}, net ${euros(sum.net)} euros.`,
      ...matches.slice(0, max).map(renderEntry)
    ]
    if (matches.length > max) {
      lines.push(`… ${matches.length - max} more not listed; narrow the search or raise the limit.`)
    }
    return lines.join('\n')
  }))

  server.registerTool('get_document', {
    title: 'Get a document',
    description: 'One transaction document with all its entries. Give either `id`, or `period` and the document `number` shown in the UI and in reports.',
    inputSchema: {
      db,
      id: z.number().int().optional().describe('Document id.'),
      period: period.optional(),
      number: z.number().int().optional().describe('Document number within the period.')
    },
    annotations: READ_ONLY
  }, safe(async ({ db, id, period, number }) => {
    const accs = await accounts(db)
    if (id !== undefined) {
      return renderDocument(await api.get<Document>(`/db/${encodeURIComponent(db)}/document/${id}`), accs)
    }
    if (period === undefined || number === undefined) {
      throw new Error('Give either id, or both period and number.')
    }
    const doc = (await documents(db, period)).find(d => d.number === number)
    if (!doc) {
      throw new Error(`No document #${number} in period ${period}.`)
    }
    return renderDocument(doc, accs)
  }))

  if (options.readOnly) {
    return
  }

  server.registerTool('create_draft', {
    title: 'Propose a document',
    description: 'Propose a new transaction document as a draft. It is NOT booked: it waits in Bookkeeper\'s Drafts view until a person confirms or rejects it, and you cannot confirm it yourself. ' +
      'Entries must balance (debits = credits). Look up account numbers with list_accounts first, and check similar earlier documents with search_entries to follow the company\'s usual accounts and VAT treatment.',
    inputSchema: {
      db,
      period,
      date: z.string().describe('Document date, YYYY-MM-DD, inside the period.'),
      description: z.string().max(256).describe('Document description, used for entries that have none of their own.'),
      entries: z.array(z.object({
        account: z.string().describe('Account number, e.g. "4000".'),
        debit: z.number().optional().describe('Debit amount in euros.'),
        credit: z.number().optional().describe('Credit amount in euros.'),
        description: z.string().max(256).optional().describe('Entry description.')
      })).min(2).describe('Entries, each with exactly one of debit or credit.'),
      note: z.string().max(2000).optional().describe('Explanation for the person reviewing the draft: the source document, reasoning, anything uncertain.')
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  }, safe(async ({ db, period, date, description, entries, note }) => {
    const accs = await accounts(db)
    const draft = await api.post<Draft>(`/db/${encodeURIComponent(db)}/draft`, {
      period_id: period,
      date,
      description,
      entries: buildDraftEntries(entries, accs),
      data: { source: options.source || 'mcp', ...(note ? { note } : {}) }
    })
    return `${renderDraft(draft, accs)}\nSaved as a draft. A person must confirm it in Bookkeeper before it is booked.`
  }))

  server.registerTool('list_drafts', {
    title: 'List drafts',
    description: 'List documents proposed but not yet confirmed or rejected.',
    inputSchema: { db, period: period.optional() },
    annotations: READ_ONLY
  }, safe(async ({ db, period }) => {
    const [drafts, accs] = await Promise.all([
      api.get<Draft[]>(`/db/${encodeURIComponent(db)}/draft`, { period: period === undefined ? undefined : `${period}` }),
      accounts(db)
    ])
    return drafts.length ? drafts.map(d => renderDraft(d, accs)).join('\n\n') : 'No drafts.'
  }))

  server.registerTool('delete_draft', {
    title: 'Delete a draft',
    description: 'Withdraw a draft that has not been confirmed, e.g. one you made by mistake. Booked documents cannot be changed with this.',
    inputSchema: { db, id: z.number().int().describe('Draft id.') },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false }
  }, safe(async ({ db, id }) => {
    await api.delete(`/db/${encodeURIComponent(db)}/draft/${id}`)
    return `Draft ${id} deleted.`
  }))
}
