import path from 'path'
import knex from './knex'
import { DB, BookkeeperImporter } from '@tasenor/common-node'
import catalog from './catalog'
import { DbDataModel, DatabaseName, Hostname, error } from '@tasenor/common'

/**
 * Helper to create new database for a customer.
 */
export async function createNewDatabase(dbName, email, config): Promise<boolean> {
  if (!DB.isValidName(dbName)) {
    throw new Error(`Invalid database name ${dbName}.`)
  }
  const masterDb = knex.masterDb()
  dbName = await DB.findName(masterDb, dbName)
  const masterConfig = DB.getMasterConfig()
  try {
    const dbId = await DB.create(masterDb, dbName, masterConfig.connection.host, masterConfig.connection.port, path.join(__dirname, '..', 'migrations-bookkeeping'))
    const userId = await masterDb('users').select('id').where({ email }).first()
    await masterDb('database_users').insert({ user_id: userId.id, database_id: dbId, config: { isCreator: true } })
    const userDb = await DB.get(masterDb, dbName)
    await userDb('settings').insert({ name: 'databaseId', value: JSON.stringify(dbId) })
    for (const [name, value] of Object.entries(config)) {
      await userDb('settings').insert({ name, value: JSON.stringify(value) })
    }
  } catch (err) {
    error('DB creation failed', err)
    return false
  }
  return true
}

/**
 * Helper to set up initial data for the new database.
 */
export async function initializeNewDatabase(name, email, schemePaths) {
  const db = await knex.db(email, name)
  const importer = new BookkeeperImporter()
  await importer.setAccounts(db, schemePaths)
  await catalog.installPluginsToDb(db)
}

/**
 * Make some defaults for plugin settings we can figure in initialization phase.
 * @param name
 * @param email
 */
export async function initializeSettings(name, email, settings) {
  const userDb = await knex.db(email, name)

  const vatTypes = [
    'VAT_FROM_SALES',
    'VAT_FROM_PURCHASES',
    'VAT_PAYABLE',
    'VAT_RECEIVABLE',
    'VAT_DELAYED_PAYABLE',
    'VAT_DELAYED_RECEIVABLE'
  ]
  const accounts = await userDb('account').select('number', 'data').whereRaw(`data->>'code' IN ('${vatTypes.join("','")}')`)
  const vatAccountMap = accounts.reduce((prev, cur) => ({ ...prev, [cur.data.code]: cur.number }), {})
  const vatMap = {
    VAT_FROM_SALES: 'VAT.salesAccount',
    VAT_FROM_PURCHASES: 'VAT.purchasesAccount',
    VAT_PAYABLE: 'VAT.payableAccount',
    VAT_RECEIVABLE: 'VAT.receivableAccount',
    VAT_DELAYED_PAYABLE: 'VAT.delayedPayableAccount',
    VAT_DELAYED_RECEIVABLE: 'VAT.delayedReceivableAccount'
  }
  for (const id of Object.keys(vatMap)) {
    if (vatAccountMap[id]) {
      const name = vatMap[id]
      const value = vatAccountMap[id]
      settings[name] = value
    }
  }

  for (const name of Object.keys(settings)) {
    await userDb('settings').insert({ name, value: JSON.stringify(settings[name]) })
  }
}

/**
 * Upgrgade all databases.
 */
async function migrate(): Promise<void> {
  const masterMigrations = path.join(__dirname, '..', 'migrations-master')
  await DB.migrateMaster(masterMigrations)
  const all = await DB.customerDbs()
  const master = await DB.getMaster()
  const migrations = path.join(__dirname, '..', 'migrations-bookkeeping')
  for (const db of all) {
    await DB.migrate(master, db.database as DatabaseName, migrations, process.env.DB_HOST_OVERRIDE as Hostname)
  }
}

/**
 * Rollback customer databases.
 */
async function rollback(): Promise<void> {
  const all = await DB.customerDbs()
  const master = await DB.getMaster()
  const migrations = path.join(__dirname, '..', 'migrations-bookkeeping')
  for (const db of all) {
    await DB.rollback(master, db.database as DatabaseName, migrations, process.env.DB_HOST_OVERRIDE as Hostname)
  }
}

/**
 * Get all databases.
 */
async function getAll(): Promise<DbDataModel[]> {
  const db = knex.masterDb()
  return db('databases').select('id', 'name', 'created', 'config').orderBy('name')
}

export default {
  getAll,
  migrate,
  rollback,
  createNewDatabase,
  initializeNewDatabase,
  initializeSettings
}
