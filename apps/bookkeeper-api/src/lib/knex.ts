import { DatabaseName, Hostname } from '@tasenor/common'
import { DB, KnexConfig, KnexDatabase, nodeEnv } from '@tasenor/common-node'
import knexfileMaster from '../knexfile-master'

/**
 * Get the list of all database names.
 * @return {String[]} A list of database names.
 */
async function allDbs(): Promise<DatabaseName[]> {
  const db = masterDb()
  return db('databases').pluck('databases.name')
}

/**
 * Get the list of database names available for user.
 * @param {String} user
 * @return {String[]} A list of database names.
 */
async function dbs(user): Promise<DatabaseName[]> {
  if (!user) {
    throw new Error(`Need user when looking for databases, not '${JSON.stringify(user)}'.`)
  }
  const db = masterDb()
  return db('databases').select('databases.name').join('database_users', 'databases.id', 'database_users.database_id').join('users', 'database_users.user_id', 'users.id').where('users.email', '=', user).pluck('databases.name')
}

/**
 * Check if database exists.
 * @param {String} user
 * @param {String} name The database name.
 * @returns {Boolean}
 */
async function isDb(user, name): Promise<boolean> {
  return (await dbs(user)).includes(name)
}

/**
 * Get the database handle for the current user.
 * @param {String} user The ower email.
 * @param {String} name The database name.
 * @param {String} hostOverride Use this host instead of host found in database.
 * @return {Knex} A configured knex instance.
 */
async function db(user, name, hostOverride = process.env.DB_HOST_OVERRIDE): Promise<KnexDatabase> {
  if (!user || !(await isDb(user, name))) {
    throw new Error('No such DB as ' + name)
  }
  return DB.get(masterDb(), name, hostOverride as Hostname)
}

/**
 * Get the instance of the master database.
 */
let masterDbCache: KnexDatabase
function masterDb(): KnexDatabase {
  if (masterDbCache) {
    return masterDbCache
  }
  const masterConf = knexfileMaster[nodeEnv()]
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const knex = require('knex')

  masterDbCache = knex(masterConf)
  return masterDbCache
}

/**
 * Get the settings for the user for the given DB.
 * @param {string} user
 * @param {string} dbName
 */
async function dbSettings(email, name): Promise<KnexConfig|null> {
  const master = await masterDb()
  const user = await master('users').select('id', 'config').where({ email }).first()
  const masterConf = await master('databases').select('id', 'config').where({ name }).first()
  if (!user || !masterConf) {
    return null
  }
  const userConf = await master('database_users').select('config').where({ database_id: masterConf.id, user_id: user.id }).first()
  if (!userConf) {
    return null
  }
  const userDb = await db(email, name)
  const userDbConf = await userDb('settings').select('name', 'value')

  const config = {}
  userDbConf.forEach(line => {
    config[line.name] = line.value
  })

  return Object.assign(config, user.config, masterConf.config, userConf.config)
}

/**
 * Update some settings in the given DB.
 * @param {string} name
 * @param {object} values
 */
async function changeDbSettings(email, name, values): Promise<void> {
  const userDb = await db(email, name)
  for (const [name, value] of Object.entries(values)) {
    if (['databaseId', 'admin', 'superuser', 'isCreator'].includes(name)) {
      throw new Error(`Cannot change ${name} setting.`)
    }
    const setting = await userDb('settings').where({ name }).count().first()
    if (setting && parseInt((setting).count + '') > 0) {
      await userDb('settings').update({ value: JSON.stringify(value) }).where({ name })
    } else {
      await userDb('settings').insert({ name, value: JSON.stringify(value) })
    }
  }
}

/**
 * Disconnect master DB.
 */
async function disconnect(): Promise<void> {
  masterDb().destroy()
}

export default {
  allDbs,
  dbs,
  disconnect,
  isDb,
  db,
  masterDb,
  dbSettings,
  changeDbSettings
}
