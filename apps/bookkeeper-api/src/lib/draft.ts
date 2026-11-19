import { HttpResponse } from '@tasenor/common'
import { KnexDatabase } from '@tasenor/common-node'
import data from './data'

/**
 * One proposed entry. The amount is in cents like everywhere else in the API.
 */
export interface DraftEntry {
  account_id: number
  debit: boolean
  amount: number
  description?: string
}

export interface DraftInput {
  period_id: number
  date: string
  description: string
  entries: DraftEntry[]
  data?: Record<string, unknown>
}

export interface Draft extends DraftInput {
  id: number
  created_by: string
  created: string
}

const fail = (message: string, status: 400 | 404 = 400): HttpResponse => ({ success: false, status, message })

/**
 * Check that a draft could be booked as it stands: the period is open, the date is inside it,
 * the accounts exist and debits equal credits. Returns null when everything is fine.
 */
export async function check(db: KnexDatabase, draft: DraftInput): Promise<HttpResponse | null> {
  if (!draft || typeof draft !== 'object') {
    return fail('No draft given.')
  }
  if (!Number.isInteger(draft.period_id)) {
    return fail('No period given.')
  }
  const period = await db('period').select('start_date', 'end_date', 'locked').where({ id: draft.period_id }).first()
  if (!period) {
    return fail('Period not found.')
  }
  if (period.locked) {
    return fail('Period is locked.')
  }
  const date = `${draft.date || ''}`.substring(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return fail('Date must be YYYY-MM-DD.')
  }
  if (date < `${period.start_date}`.substring(0, 10) || date > `${period.end_date}`.substring(0, 10)) {
    return fail('Date is outside of the period.')
  }
  if (typeof draft.description !== 'string' || !draft.description.trim()) {
    return fail('No description given.')
  }
  if (draft.description.length > 256) {
    return fail('Description is longer than 256 characters.')
  }
  if (!Array.isArray(draft.entries) || draft.entries.length < 2) {
    return fail('A draft needs at least two entries.')
  }
  let debit = 0
  let credit = 0
  for (const entry of draft.entries) {
    if (!Number.isInteger(entry.amount) || entry.amount <= 0) {
      return fail('Entry amounts must be positive integers in cents.')
    }
    if (typeof entry.debit !== 'boolean') {
      return fail('Every entry must say whether it is a debit.')
    }
    if (entry.description !== undefined && (typeof entry.description !== 'string' || entry.description.length > 256)) {
      return fail('Entry description must be a string of at most 256 characters.')
    }
    if (entry.debit) {
      debit += entry.amount
    } else {
      credit += entry.amount
    }
  }
  if (debit !== credit) {
    return fail(`Debits (${debit}) and credits (${credit}) do not match.`)
  }
  const ids = Array.from(new Set(draft.entries.map(e => e.account_id)))
  if (ids.some(id => !Number.isInteger(id))) {
    return fail('Every entry needs an account_id.')
  }
  const found = await db('account').select('id').whereIn('id', ids)
  if (found.length !== ids.length) {
    return fail('Unknown account in entries.')
  }
  return null
}

/**
 * Keep only the fields a draft has, so nothing else can be smuggled into the row.
 */
function clean(draft: DraftInput) {
  return {
    period_id: draft.period_id,
    date: `${draft.date}`.substring(0, 10),
    description: draft.description.trim(),
    entries: JSON.stringify(draft.entries.map(e => ({
      account_id: e.account_id,
      debit: e.debit,
      amount: e.amount,
      description: e.description || draft.description.trim()
    }))),
    data: draft.data && typeof draft.data === 'object' ? draft.data : {}
  }
}

export async function create(db: KnexDatabase, draft: DraftInput, user: string): Promise<HttpResponse> {
  const bad = await check(db, draft)
  if (bad) {
    return bad
  }
  const result = await data.createOne(db, 'draft', { ...clean(draft), created_by: user })
  if (!result) {
    return fail('Error when writing database.')
  }
  return { success: true, status: 200, data: result }
}

/**
 * Book a draft: create the document and its entries and delete the draft, all or nothing.
 * The draft is checked again, since the period may have been locked or an account removed
 * since it was made.
 */
export async function confirm(db: KnexDatabase, id: number, user: string): Promise<HttpResponse> {
  const draft: Draft | undefined = await db('draft').select('*').where({ id }).first()
  if (!draft) {
    return fail('Draft not found.', 404)
  }
  draft.date = `${draft.date}`.substring(0, 10)
  const bad = await check(db, draft)
  if (bad) {
    return bad
  }
  const document = await db.transaction(async trx => {
    // Lock the period's documents so two confirmations cannot take the same number.
    await trx.raw('LOCK TABLE document IN SHARE ROW EXCLUSIVE MODE')
    const number = await data.getNextDocument(trx, draft.period_id)
    const [doc] = await trx('document').insert({
      period_id: draft.period_id,
      date: draft.date,
      number,
      data: { ...(draft.data || {}), draft: { id: draft.id, created_by: draft.created_by, created: draft.created, confirmed_by: user } }
    }).returning('*')
    let row = 1
    for (const entry of draft.entries) {
      await trx('entry').insert({
        document_id: doc.id,
        account_id: entry.account_id,
        debit: entry.debit,
        amount: entry.amount / 100,
        description: entry.description || draft.description,
        row_number: row++
      })
    }
    await trx('draft').where({ id }).delete()
    return doc
  })
  return { success: true, status: 200, data: document }
}
