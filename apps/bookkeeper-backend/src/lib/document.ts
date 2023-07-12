import { DocumentModelData, HttpResponse } from '@dataplug/tasenor-common'
import { KnexDatabase } from '@dataplug/tasenor-common-node'
import data from './data'

/**
 * Check document data.
 * @param entry
 */
async function check(db: KnexDatabase, doc: DocumentModelData): Promise<HttpResponse | null> {
  if (!doc.period_id) {
    return {
      success: false,
      status: 400,
      message: 'No period given.'
    }
  }
  const locked = await data.isLocked(db, 'period', doc.period_id)
  if (locked) {
    return {
      success: false,
      status: 400,
      message: 'Period is locked.'
    }
  }
  return null
}

/**
 * Create new document.
 * @param doc
 */
export async function create(db: KnexDatabase, doc: DocumentModelData): Promise<HttpResponse | null> {

  const bad = await check(db, doc)
  if (bad) {
    return bad
  }

  // Calculate document number.
  let number
  if (doc.number !== null && doc.number !== undefined) {
    number = doc.number
  } else {
    number = await data.getNextDocument(db, doc.period_id)
  }

  const document = { }
  Object.assign(document, doc, { number })
  const result = await data.createOne(db, 'document', document).catch(
    () => ({
      success: false,
      status: 400,
      message: 'Error when writing database.'
    })
  )
  return ({ success: true, data: result, status: 200 })
}

/**
 * Update existing document.
 * @param doc
 */
export async function update(db: KnexDatabase, doc: DocumentModelData): Promise<HttpResponse | null> {

  const bad = await check(db, doc)
  if (bad) {
    return bad
  }

  return data.updateOne(db, 'document', doc.id, doc).catch(() => ({
    success: false,
    status: 400,
    message: 'Error when writing database.'
  })).then(status => ({ success: true, status: 204 }))
}
