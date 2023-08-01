import { error } from '@tasenor/common'
import { KnexDatabase } from '@tasenor/common-node'

/**
 * A collection of data fetching functions.
 */
const plural = {
  account: 'accounts',
  document: 'documents',
  entry: 'entries',
  period: 'periods'
}

const fields = {
  tags: {
    tag: true,
    name: true,
    picture: true,
    mime: true,
    type: true,
    order: true
  },
  period: {
    end_date: true,
    locked: true,
    start_date: true
  },
  document: {
    period_id: true,
    number: true,
    data: true,
    date: true
  },
  entry: {
    document_id: true,
    account_id: true,
    amount: true,
    data: true,
    debit: true,
    description: true,
    flags: true,
    row_number: true
  },
  account: {
    flags: true,
    name: true,
    number: true,
    type: true,
    data: true,
    currency: true,
    language: true
  },
  heading: {
    number: true,
    text: true,
    level: true
  },
  report: {
    id: true,
    data: true
  }
}

/**
 * General purpose query for fetching all entries from a table.
 * @param {Knex} db
 * @param {String} className
 * @param {object} where
 * @param {Array} order
 */
async function listAll(db: KnexDatabase, className: string, where: Record<string, unknown> | string | null = null, order: string[] | null = null) {
  if (!fields[className]) {
    throw new Error('No definition for entries for ' + className)
  }
  let ret = db.select('*').from(className)
  if (where) {
    ret = ret.where(where)
  }
  if (order) {
    const orderBy = order.map(o => o[0] === '-' ? `"${o.substr(1)}" desc` : `"${o}" asc`)
    ret = ret.orderByRaw(orderBy.join(', '))
  }
  return ret
}

/**
 * Get one entry.
 * @param {Knex} db
 * @param {String} className
 * @param {Number} id
 * @param {String} joinClass
 * @param {String[]} joinClassOrder
 */
async function getOne(db, className, id, joinClass: string | null = null, joinClassOrder: string[] | null = null) {
  let ret: Record<string, unknown> | null = null
  return db.select('*').from(className).where({ id })
    .then(entries => {
      ret = entries.length ? entries[0] : null
      if (joinClass && ret) {
        const where = {}
        where[className + '_id'] = id
        return listAll(db, joinClass, where, joinClassOrder)
          .then(entries => {
            if (!ret) {
              ret = {}
            }
            ret[plural[joinClass]] = entries
            return ret
          })
      } else {
        return ret
      }
    })
}

/**
 * Update an entry in the table.
 * @param {Knex} db
 * @param {String} className
 * @param {Number} id
 * @param {Object} data
 */
async function updateOne(db, className, id, data) {
  try {
    id = parseInt(id)
  } catch (err) {
    id = 0
  }
  if (!id) {
    throw new Error(`No ID given to update ${className}.`)
  }
  return db(className).where({ id }).update(data)
}

/**
 * Remove an entry from the table.
 * @param {Knex} db
 * @param {String} className
 * @param {Number} id
 */
async function deleteOne(db, className, id) {
  return deleteMany(db, className, { id })
}

/**
 * Remove an entry from the table.
 * @param {Knex} db
 * @param {String} className
 * @param {Number} id
 * @param {Object} where
 */
async function deleteMany(db, className, where) {
  return db(className).where(where).delete()
}

/**
 * Create an entry in the table.
 * @param {Knex} db
 * @param {String} className
 * @param {Object} data
 * @return {Object}
 */
async function createOne(db, className, data) {
  return db(className).insert(data).returning('*')
    .then((data) => {
      return data[0]
    })
    .catch(err => {
      error(err)
      return null
    })
}

/**
 * Get all accounts having activities on the period.
 * @param {Knex} db
 * @param {Number} periodId
 */
async function getPeriodAccounts(db, periodId) {
  return db.select('account.id', 'account.number', 'account.name').from('entry')
    .leftJoin('account', 'account.id', 'entry.account_id')
    .leftJoin('document', 'document.id', 'entry.document_id')
    .where({ 'document.period_id': periodId })
    .orderBy('account.number')
    .groupBy('entry.account_id')
}

async function getPeriodCredits(db, periodId) {
  return db.select('account.id', 'account.number', 'account.name', db.raw('SUM(entry.amount * 100) as amount')).from('entry')
    .leftJoin('account', 'account.id', 'entry.account_id')
    .leftJoin('document', 'document.id', 'entry.document_id')
    .where({ 'document.period_id': periodId })
    .where({ 'entry.debit': 0 })
    .orderBy('account.number')
    .groupBy('account.id')
}

async function getPeriodDebits(db, periodId) {
  return db.select('account.id', 'account.number', 'account.name', db.raw('SUM(entry.amount * 100) as amount')).from('entry')
    .leftJoin('account', 'account.id', 'entry.account_id')
    .leftJoin('document', 'document.id', 'entry.document_id')
    .where({ 'document.period_id': periodId })
    .where({ 'entry.debit': 1 })
    .orderBy('account.number')
    .groupBy('account.id')
}

/**
 * Get all balances for accounts having entries on the given period.
 * @param {Knex} db
 * @param {Number} periodId
 */
async function getPeriodBalances(db, periodId) {
  return getOne(db, 'period', periodId)
    .then(data => {
      return getPeriodCredits(db, periodId)
        .then(entries => {
          if (data) data.credit = entries
          return data
        })
    })
    .then(data => {
      return getPeriodDebits(db, periodId)
        .then(entries => {
          if (data) data.debit = entries
          return data
        })
    })
    .then(data => {
      if (!data) return data
      const accounts = {}
      data.debit.forEach(item => {
        accounts[item.id] = item
        accounts[item.id].debit = item.amount
      })
      data.credit.forEach(item => {
        accounts[item.id] = accounts[item.id] || item
        accounts[item.id].credit = item.amount
      })

      data.balances = Object.values(accounts)
      data.balances.forEach(account => {
        delete account.amount
        account.debit = Math.round(account.debit) || 0
        account.credit = Math.round(-account.credit) || 0
        account.total = Math.round(account.debit + account.credit)
        account.period_id = parseInt(periodId)
      })

      data.balances = data.balances.sort((a, b) => (a.number > b.number ? 1 : (a.number < b.number ? -1 : 0)))

      delete data.debit
      delete data.credit

      return data
    })
}

/**
 * Get all documents for an account during the given period.
 * @param {Knex} db
 * @param {Number} periodId
 * @param {Number} accountId
 */
async function getAccountTransactions(db, periodId, accountId) {
  return db.select('document.*').from('document')
    .leftJoin('entry', 'document.id', 'entry.document_id')
    .where({ 'document.period_id': periodId })
    .where({ 'entry.account_id': accountId })
    .orderBy(['document.date', 'document.number'])
    .groupBy('document.id')
}

/**
 * Get all transactions for an account during the given period including all entries for each transaction.
 * @param {Knex} db
 * @param {Number} periodId
 * @param {Number} accountId
 */
async function getAccountTransactionsWithEntries(db, periodId, accountId) {
  return getAccountTransactions(db, periodId, accountId)
    .then((txs) => {
      const txByDocID = {}
      const docIds = txs.map((tx) => {
        txByDocID[tx.id] = txByDocID[tx.id] || []
        txByDocID[tx.id].push(tx)
        tx.entries = []
        return tx.id
      })
      return db.select('entry.*', 'entry.id AS entry_id', 'account.number', 'account.name').from('entry').whereIn('document_id', docIds).orderBy(['document_id', 'row_number'])
        .leftJoin('account', 'account.id', 'entry.account_id')
        .then((entries) => {
          entries.forEach((entry) => {
            entry.amount = Math.round(entry.amount * 100)
            entry.id = entry.entry_id
            delete entry.entry_id
            txByDocID[entry.document_id].forEach((tx) => tx.entries.push(entry))
          })
          return txs
        })
    })
}

/**
 * Get all transactions for the given period including all entries for each transaction.
 * @param {Knex} db
 * @param {Number} periodId
 * @param {Number} accountId
 */
async function getPeriodTransactionsWithEntries(db, periodId) {
  return db.select('*').from('document').where({ period_id: periodId })
    .then((docs) => {
      const docsById = {}
      docs.forEach((doc) => {
        docsById[doc.id] = doc
        docsById[doc.id].entries = []
      })

      return db.select('entry.*').from('document').where({ period_id: periodId })
        .join('entry', 'entry.document_id', 'document.id')
        .orderBy(['entry.document_id', 'entry.row_number'])
        .then((entries) => {
          entries.forEach((entry) => {
            entry.amount = Math.round(entry.amount * 100)
            docsById[entry.document_id].entries.push(entry)
          })
          return Object.values(docsById)
        })
    })
}

/**
 * Get all transactions for an account (specified by account number) during the given period.
 * @param {Knex} db
 * @param {Number} periodId
 * @param {Number} accountId
 */
async function getAccountTransactionsByNumber(db, periodId, accountNumber) {
  return getAccountId(db, accountNumber)
    .then(({ id }) => {
      return getAccountTransactions(db, periodId, id)
    })
}

/**
 * Convert account number to ID.
 * @param {Knex} db
 * @param {Number} number Account number.
 * @return An object {id: <id>, number: <number>} or null if not found.
 */
async function getAccountId(db, number) {
  return db.select('id').from('account')
    .where({ 'account.number': number })
    .then(account => (account.length ? { number, id: account[0].id } : null))
}

/**
 * Get full mapping from account IDs to their numbers.
 * @param {Knex} db
 */
let accountsById: Record<number, string> | null = null
async function getAccountsById(db) {
  if (accountsById) {
    return Promise.resolve(accountsById)
  }
  return db.select('id', 'number')
    .from('account')
    .then((data) => {
      accountsById = {}
      data.forEach((account) => ((accountsById as Record<number, string>)[account.id] = account.number))
      return accountsById
    })
}

/**
 * Get full mapping from account numbers to their IDs.
 * @param {Knex} db
 */
let accountsByNumber: Record<number, string> | null = null
async function getAccountsByNumber(db) {
  if (accountsByNumber) {
    return Promise.resolve(accountsByNumber)
  }
  return db.select('id', 'number')
    .from('account')
    .then((data) => {
      accountsByNumber = {}
      data.forEach((account) => ((accountsByNumber as Record<number, string>)[account.number] = account.id))
      return accountsByNumber
    })
}

/**
 * Get full mapping from account numbers to their names.
 * @param {Knex} db
 */
let accountNamesByNumber: Record<number, string> | null = null
async function getAccountNamesByNumber(db) {
  if (accountNamesByNumber) {
    return Promise.resolve(accountNamesByNumber)
  }
  return db.select('name', 'number')
    .from('account')
    .then((data) => {
      accountNamesByNumber = {}
      data.forEach((account) => ((accountNamesByNumber as Record<number, string>)[account.number] = account.name))
      return accountNamesByNumber
    })
}

/**
 * Find the next free document number.
 * @param {Knex} db
 * @param {Number} periodId
 */
async function getNextDocument(db, periodId) {
  return db
    .select(db.raw('MAX(number) AS number'))
    .from('document')
    .where({ period_id: periodId })
    .first()
    .then((res) => {
      return res.number ? res.number + 1 : 1
    })
}

/**
 * Check if the period of the target is locked.
 * @param {String} what
 * @param {Number} id
 */
async function isLocked(db, what, id) {
  switch (what) {
    case 'entry':
      return db.select('document_id').from('entry').where({ id }).first()
        .then((res) => res && db.select('period_id').from('document').where({ id: res.document_id }).first())
        .then((res) => res && db.select('locked').from('period').where({ id: res.period_id }).first())
        .then((res) => {
          return !res || res.locked
        })

    case 'document':
      return db.select('period_id').from('document').where({ id }).first()
        .then((res) => res && db.select('locked').from('period').where({ id: res.period_id }).first())
        .then((res) => {
          return !res || res.locked
        })

    case 'period':
      return db.select('locked').from('period').where({ id }).first()
        .then((res) => {
          return !res || res.locked
        })

    default:
      error(`Don't know how to check lock for '${what}'.`)
      return true
  }
}

/**
 * Count entry count and collect period information for an account.
 */
async function getAccountTransactionCountByPeriod(db, id) {
  const results = await db.select('period.*', db.raw('COUNT(*) AS entries')).from('entry')
    .leftJoin('document', 'entry.document_id', 'document.id')
    .leftJoin('period', 'document.period_id', 'period.id')
    .where({ account_id: id })
    .orderBy('period.id')
    .groupBy('period.id')
  return results.map(e => ({ ...e, entries: parseInt(e.entries) }))
}

export default {
  createOne,
  deleteMany,
  deleteOne,
  getAccountId,
  getAccountNamesByNumber,
  getAccountsById,
  getAccountsByNumber,
  getAccountTransactionCountByPeriod,
  getAccountTransactions,
  getAccountTransactionsByNumber,
  getAccountTransactionsWithEntries,
  getNextDocument,
  getOne,
  getPeriodAccounts,
  getPeriodBalances,
  getPeriodTransactionsWithEntries,
  isLocked,
  listAll,
  updateOne
}
