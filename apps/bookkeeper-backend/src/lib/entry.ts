import { EntryModelData, HttpResponse } from '@dataplug/tasenor-common'
import { KnexDatabase } from '@dataplug/tasenor-common-node'
import data from './data'

/**
 * Check entry data.
 * @param entry
 */
async function check(db: KnexDatabase, entry: EntryModelData): Promise<HttpResponse | null> {

  const locked = await data.isLocked(db, 'document', entry.document_id)
  if (locked) {
    return {
      success: false,
      status: 400,
      message: 'Period is locked.'
    }
  }
  if (!entry.account_id) {
    return {
      success: false,
      status: 400,
      message: 'No account given.'
    }
  }
  if (!entry.document_id) {
    return {
      success: false,
      status: 400,
      message: 'Transaction missing.'
    }
  }
  return null
}

/**
 * Create new entry.
 * @param entry
 */
export async function create(db: KnexDatabase, entry: EntryModelData): Promise<HttpResponse> {

  const bad = await check(db, entry)
  if (bad) {
    return bad
  }

  entry.amount /= 100

  return data.createOne(db, 'entry', entry).then(
    data => ({ success: true, status: 200, data })
  )
}

/**
 * Update old entry.
 * @param entry
 */
export async function update(db: KnexDatabase, entry: EntryModelData): Promise<HttpResponse> {

  const bad = await check(db, entry)
  if (bad) {
    return bad
  }

  entry.amount /= 100

  return data.updateOne(db, 'entry', entry.id, entry).then(() => ({ success: true, status: 204 }))
}
