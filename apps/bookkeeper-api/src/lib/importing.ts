/* eslint-disable camelcase */
import { DocumentModel, DocumentModelData, EntryModel, EntryModelData, isHttpFailureResponse, Transaction, ID } from '@tasenor/common'
import catalog from './catalog'
import { ImportConnector } from './ImportConnector'
import { create as createDocument } from './document'
import { create as createEntry } from './entry'
import dayjs from 'dayjs'
import { periodOf } from './period'
import { KnexDatabase, ProcessingSystem } from '@tasenor/common-node'

/**
 * Construct import system based on its configuration ID.
 * @param db
 * @param importerId
 * @returns
 */
export async function getImportSystem(db: KnexDatabase, importerId: ID): Promise<ProcessingSystem> {
  const importer = await db('importers').select('id', 'config').where({ id: importerId }).first()
  const usableHandlers = new Set(importer.config.handlers)
  const handlers = catalog.getImportHandlers().filter(handler => usableHandlers.has(handler.name))
  const connector = new ImportConnector(db, importer)
  const system = new ProcessingSystem(db, connector)

  handlers.forEach(handler => system.register(handler))

  return system
}

/**
 * Create complete transaction including document and entries.
 */
export async function createTransaction(db: KnexDatabase, tx: Transaction, processId: ID, importerId: ID, ignoreExisting: boolean): Promise<DocumentModelData> {

  // Check the existing import.
  const segmentId = tx.segmentId
  if (!segmentId) {
    throw new Error(`Cannot create transaction without segmentId ${JSON.stringify(tx)}.`)
  }

  // For multipart transactions, all but the first are added without the check.
  if (!ignoreExisting) {
    const old = await db('segment_document').select('document_id').where({ segment_id: segmentId, importer_id: importerId }).pluck('document_id')
    if (old.length) {
      throw new Error(`Cannot import ${JSON.stringify(tx)} since it is already imported as #${old.join(' ')}.`)
    }
  }

  // Find period.
  const date = dayjs(tx.date).format('YYYY-MM-DD')
  const period = await periodOf(db, tx.date)
  if (!period) {
    throw new Error(`Unable to find a suitable period for the transaction date '${tx.date}'.`)
  }
  if (period.locked) {
    throw new Error(`Period for the transaction date '${tx.date}' is already locked.`)
  }

  // Create document.
  const doc: DocumentModelData = { date, period_id: period.id }
  const res = await createDocument(db, doc)
  if (isHttpFailureResponse(res)) {
    throw new Error(`Creation of transaction document ${JSON.stringify(doc)} failed: ${res.message}`)
  }
  Object.assign(doc, res.data)
  doc.entries = []
  // eslint-disable-next-line camelcase
  const document_id = (res.data as unknown as DocumentModel).id

  // Create entries.
  // eslint-disable-next-line camelcase
  let row_number = 1
  for (const e of tx.entries) {
    const account = await db('account').select('id').where({ number: e.account }).first()
    if (!account) {
      throw new Error(`Cannot find account ${e.account} for transaction ${JSON.stringify(res.data)} entry ${JSON.stringify(e)}.`)
    }
    const entry: EntryModelData = {
      account_id: account.id,
      amount: Math.abs(e.amount),
      data: e.data,
      debit: e.amount < 0 ? 0 : 1,
      description: e.description,
      document_id,
      row_number
    }
    const res2 = await createEntry(db, entry).catch(async (err) => {
      // Transaction did not catch this properly. Doing manual.
      await db('entry').where({ document_id }).delete()
      await db('document').where({ id: document_id }).delete()
      throw err
    })
    if (isHttpFailureResponse(res2)) {
      throw new Error(`Creation of transaction entry ${JSON.stringify(entry)} failed: ${res2.message}`)
    }
    doc.entries.push(res2.data as unknown as EntryModel)
    // eslint-disable-next-line camelcase
    row_number++
  }

  // Save import info.
  await db('segment_document').insert({ process_id: processId, document_id, segment_id: segmentId, importer_id: importerId })

  return doc
}

export async function deleteTransaction(db: KnexDatabase, docId: ID): Promise<void> {
  await db('entry').where({ document_id: docId }).delete()
  await db('document').where({ id: docId }).delete()
}
