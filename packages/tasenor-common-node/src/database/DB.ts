import { Crypto, DatabaseName, Hostname, isDatabaseName, log, Secret, Url } from '@dataplug/tasenor-common'
import { randomString, vault } from '..'
import knex, { Knex } from 'knex'
import { types } from 'pg'
import { builtins } from 'pg-types'
import { create as opaque } from 'ts-opaque'

// Fix Knex messing around with the date values and timezones.
const parseDate = (val) => val
types.setTypeParser(builtins.TIMESTAMPTZ, parseDate)
types.setTypeParser(builtins.TIMESTAMP, parseDate)
types.setTypeParser(builtins.DATE, parseDate)

export type KnexDatabase = Knex<any, any[]>
export type KnexConfig = Record<string, any>
export type KnexConnectionInfo = {
  host: string,
  port: string | number,
  database: string,
  user: string,
  password: string
}

/**
 * Check if the database with the given name exists.
 * @param master The master database.
 * @param name Name of the DB to check.
 * @returns True if it is found.
 */
const exists = async (master: KnexDatabase, name: DatabaseName): Promise<boolean> => {
  return !!(await master('databases').select('*').where({ name }).first())
}

/**
 * Construct a Knex configuration for the given database.
 * @param master
 * @param name
 * @param hostOverride
 * @returns
 */
const getConfig = async (master: KnexDatabase, name: DatabaseName, hostOverride: null | Hostname = null): Promise<KnexConfig> => {
  const coder = new Crypto(vault.get('SECRET') as Secret)
  const userDb = await master('databases').select('*').where({ name }).first()
  const password = coder.decrypt(userDb.password)
  if (!password) {
    throw new Error('Failed to get password.')
  }
  return {
    client: 'postgresql',
    connection: {
      host: hostOverride === null ? userDb.host : hostOverride,
      port: userDb.port,
      database: userDb.name,
      user: userDb.user,
      password
    },
    pool: {
      min: 1,
      max: 3
    }
  }
}

const cache = {}
/**
 * Get the cached connection to the given customer database.
 * @param master Master database connection.
 * @param name Name of the database.
 * @param hostOverride If given, use this host instead of the host in database.
 * @returns Knex connection.
 */
const get = async (master: KnexDatabase, name: DatabaseName, hostOverride: null | Hostname = null): Promise<KnexDatabase> => {
  if (!(await exists(master, name))) {
    delete cache[name]
    throw new Error(`Database '${name}' does not exist.`)
  }

  const cacheName = hostOverride ? `${name}:${hostOverride}` : name

  if (!cache[cacheName]) {
    const knexConfig = await getConfig(master, name, hostOverride)
    cache[cacheName] = knex(knexConfig)
  }
  return cache[cacheName]
}

/**
 * Disconnect and drop cached connection.
 * @param name Name of the database.
 */
const disconnect = async (name: string): Promise<void> => {
  for (const conn of Object.entries(cache)) {
    if (conn[0].split(':')[0] === name) {
      log(`Disconnecting ${conn[0]}`)
      await (conn[1] as Knex).destroy()
      delete cache[conn[0]]
    }
  }
}

/**
 * Get the configuration for the root connection.
 * @returns Configuration object.
 */
const getRootConfig = (): KnexConfig => {
  const url = new URL(vault.get('DATABASE_URL'))
  const knexConfig = {
    client: 'postgresql',
    connection: {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: 'postgres',
      user: vault.get('DATABASE_ROOT_USER'),
      password: vault.get('DATABASE_ROOT_PASSWORD')
    },
    pool: {
      min: 1,
      max: 1
    }
  }
  return knexConfig
}

/**
 * Convert database URL to knex config.
 * @param knexUrl
 * @returns
 */
const getKnexConfig = (knexUrl: Url): KnexConfig => {
  const url = new URL(knexUrl)
  return {
    client: 'postgresql',
    connection: {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.replace(/^\//, ''),
      user: url.username,
      password: url.password
    },
    pool: {
      min: 1,
      max: 5
    }
  }
}

/**
 * Get the cached connetion to the root access.
 * @returns Knex instance.
 */
let rootCache
const getRoot = (): KnexDatabase => {
  if (rootCache) return rootCache

  rootCache = knex(getRootConfig())
  return rootCache
}

const getMasterConfig = (): KnexConfig => {
  return getKnexConfig(vault.get('DATABASE_URL') as Url)
}

/**
 * Get the master database.
 * @returns A Knex instance.
 */
let masterCache
const getMaster = (): KnexDatabase => {
  if (masterCache) return masterCache

  masterCache = knex(getMasterConfig())
  return masterCache
}

/**
 * Test if the name is valid database name.
 * @param name
 * @returns True if valid.
 */
const isValidName = (name: string): boolean => {
  return isDatabaseName(name)
}

/**
 * Create new customer database.
 * @param db Knex for bookkeeper master database.
 * @param name Name of the new database.
 * @param host A host name of the DB host.
 * @param port A port used by the DB host.
 * @param migrations Path of the migrations file.
 * @returns ID
 */
const create = async (masterDb: KnexDatabase, name: DatabaseName, host: Hostname, port: number, migrations: string | null = null, hostOverride: null | Hostname = null): Promise<any> => {
  if (await exists(masterDb, name)) {
    throw new Error(`Database '${name}' exist.`)
  }
  if (!isValidName(name)) {
    throw new Error(`Invalid database name '${name}'.`)
  }
  const rootDb = getRoot()
  const user = 'user' + randomString(20)
  const password = randomString(64)
  const crypto = new Crypto(vault.get('SECRET') as Secret)
  const entry = {
    name,
    host,
    port,
    user,
    password: crypto.encrypt(password),
    config: {}
  }
  await rootDb.raw(`CREATE USER "${user}" WITH PASSWORD '${password}'`)
  await rootDb.raw(`CREATE DATABASE "${name}"`)
  await rootDb.raw(`GRANT ALL PRIVILEGES ON DATABASE "${name}" TO "${user}"`)
  const id = (await masterDb('databases').insert(entry).returning('id'))[0].id

  if (migrations) {
    await migrate(masterDb, name, migrations, hostOverride)
  }

  return id
}

/**
 * Apply migrations to the named customer database.
 * @param masterDb
 * @param name
 * @param migrations
 * @param hostOverride
 */
const migrate = async (masterDb: KnexDatabase, name: DatabaseName, migrations: string, hostOverride: null | Hostname = null): Promise<any> => {
  const conf = await getConfig(masterDb, name, hostOverride)
  conf.migrations = { directory: migrations }
  const db = knex(conf)
  await db.migrate.latest()
  // Do not leave hanging connections.
  await db.destroy()
}

/**
 * Roll bakc last migrations from the named customer database.
 * @param masterDb
 * @param name
 * @param migrations
 * @param hostOverride
 */
const rollback = async (masterDb: KnexDatabase, name: DatabaseName, migrations: string, hostOverride: null | Hostname = null): Promise<any> => {
  const conf = await getConfig(masterDb, name, hostOverride)
  conf.migrations = { directory: migrations }
  const db = knex(conf)
  await db.migrate.rollback()
  // Do not leave hanging connections.
  await db.destroy()
}

/**
 * Destroy customer database.
 * @param masterDb
 * @param name
 * @param hostOverride
 */
const destroy = async (masterDb: KnexDatabase, name: DatabaseName, hostOverride: null | Hostname = null): Promise<string|null> => {
  const db = await masterDb('databases').where({ name }).first()
  if (!db) {
    return 'Database not found.'
  }
  const dbToDelete = await get(masterDb, name, hostOverride)
  await dbToDelete.raw(`DROP OWNED BY ${db.user}`)

  disconnect(name)

  await masterDb('database_users').where({ database_id: db.id }).delete()
  await masterDb('databases').where({ id: db.id }).delete()

  const rootDb = getRoot()
  await rootDb.raw(`DROP OWNED BY ${db.user}`)
  await rootDb.raw(`DROP USER ${db.user}`)
  await rootDb.raw(`DROP DATABASE ${db.name} WITH (FORCE)`)

  return null
}

/**
 * Generate a name for a database that does not yet exist.
 * @param masterDb - Master database.
 * @param init - Initial part of the name.
 * @returns Suitable name.
 */
async function findName(masterDb: KnexDatabase, init: string): Promise<string> {
  let n = 1
  let name = init
  while (await exists(masterDb, opaque(name))) {
    n++
    name = `${init}${n}`
  }
  return name
}

/**
 * Terminate all DB connections.
 */
async function disconnectAll() {
  if (masterCache) {
    log('Disconnecting master DB.')
    await masterCache.destroy()
  }
  if (rootCache) {
    log('Disconnecting root DB.')
    await rootCache.destroy()
  }
  for (const conn of Object.entries(cache)) {
    log(`Disconnecting ${conn[0]}`)
    await (conn[1] as Knex).destroy()
  }
}

/**
 * Get a list of all customer database connection infos.
 */
async function customerDbs(hostOverride: null | Hostname = null): Promise<KnexConnectionInfo[]> {
  const all: KnexConnectionInfo[] = []
  await vault.initialize()
  const master = await getMaster()
  const dbs = await master('databases').select('name', 'host', 'port', 'user', 'password')
  for (const db of dbs) {
    const conf = await getConfig(master, db.name, hostOverride)
    const { host, port, database, user, password } = conf.connection as KnexConnectionInfo
    all.push({ host, port, database, user, password })
  }
  return all
}

/**
 * Resolve database host from environment DATABASE_URL if set.
 */
function envHost(): string | null {
  if (!process.env.DATABASE_URL) {
    return null
  }
  const url = new URL(process.env.DATABASE_URL)
  return url.hostname
}

export const DB = {
  create,
  customerDbs,
  destroy,
  disconnectAll,
  envHost,
  exists,
  findName,
  get,
  getConfig,
  getKnexConfig,
  getMaster,
  getMasterConfig,
  getRoot,
  getRootConfig,
  isValidName,
  migrate,
  rollback
}
