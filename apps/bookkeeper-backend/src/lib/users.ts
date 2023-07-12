import knex from './knex'
import { Password, vault, tokens, isDevelopment } from '@dataplug/tasenor-common-node'
import { DAYS, NormalTokenPayload, TokenPair, Url, UserDataModel, net } from '@dataplug/tasenor-common'
import catalog from './catalog'

const ALLOWED_USER_FIELDS = ['id', 'name', 'email', 'disabled', 'config']

/**
 * Validate new user data.
 * @param {String} name
 * @param {String} password
 * @param {String} email
 * @returns {true|String}
 */
async function validateUser(name, password, email): Promise<true|string> {
  if (!password || password.length < 8) {
    return 'Password is too short.'
  }
  if (!email) {
    return 'Email is required.'
  }
  if (!name) {
    return 'Full name is required.'
  }
  if (await hasUser(email)) {
    return 'User already exists.'
  }
  return true
}

/**
 * Create new user.
 * @return {Promise<User>}
 */
async function registerUser({ name, email, password, admin, superuser }) {
  const db = knex.masterDb()
  const hash = await Password.hash(password)
  const success = await catalog.registerUser(name, email)
  if (success) {
    const hasTasenorApi = !!process.env.TASENOR_API_URL
    const res = hasTasenorApi && await net.POST(`${vault.get('TASENOR_API_URL')}/users` as Url, { name, email })
    if (!hasTasenorApi || res.success) {
      await db('users').insert({ name, email, password: hash, config: { admin: !!admin, superuser: !!superuser } })
      return await db('users').where({ email }).first()
    }
  }
  return null
}

/**
 * Check if the admin user has been created.
 * @return {Boolean}
 */
async function hasAdminUser() {
  const db = knex.masterDb()
  const user = await db('users').count().whereRaw("CAST(config->'admin' AS BOOLEAN)").first()
  return user && parseInt(`${user.count}`) > 0
}

/**
 * Check if the user has been created.
 * @return {Boolean}
 */
async function hasUser(email) {
  const db = knex.masterDb()
  const user = await db('users').count().where({ email }).first()
  return user && parseInt(`${user.count}`) > 0
}

/**
 * Check if the user password is valid.
 * @param {String} user
 * @param {String} password
 * @return {Promise<Boolean>}
 */
async function verifyPassword(user, password) {
  const db = knex.masterDb()
  const found = await db('users').select('password', 'disabled').where({ email: user }).first()
  if (!found) return false
  if (found.disabled) return false
  return Password.compare(password, found.password)
}

/**
 * Check if the user is not disabld.
 * @param user
 * @returns {Promise<boolean>} Return true if exists and not disabled.
 */
async function verifyUser(user) {
  const db = knex.masterDb()
  const found = await db('users').select('disabled').where({ email: user }).first()
  if (!found) return false
  if (found.disabled) return false
  return true
}

/**
 * Sign a token for a user if the user exists.
 * @param email
 * @returns Signed token.
 */
async function signToken(email, plugins): Promise<TokenPair> {
  const db = knex.masterDb()
  const found = await db('users').select('config').where({ email }).first()
  if (!found) {
    throw new Error(`Cannot sign token for unknown user ${email}.`)
  }
  const { config } = found
  const payload: NormalTokenPayload = {
    owner: email,
    feats: {},
    plugins
  }
  if (config.admin) {
    payload.feats.ADMIN = true
  }
  if (config.superuser) {
    payload.feats.SUPERUSER = true
  }
  return await tokens.sign2(payload, 'bookkeeping', isDevelopment() ? DAYS * 365 : 0)
}

/**
 * Check that token is properly signed.
 * @param {String} token
 * @return {Promise<Null|Object>}
 */
async function verifyToken(token, needAdmin = false) {
  if (!token) return null
  const payload = tokens.verify(token, vault.getPrivateSecret(), 'bookkeeping')
  if (!payload) return null
  if (needAdmin && !payload.feats.ADMIN) return null
  return payload.owner
}

/**
 * Get all users.
 */
async function getAll(): Promise<UserDataModel[]> {
  const db = knex.masterDb()
  return db('users').select(ALLOWED_USER_FIELDS)
}

/**
 * Get one user data.
 */
async function getOne(user): Promise<UserDataModel | null> {
  return new Promise((resolve, reject) => {
    const db = knex.masterDb()
    db('users').select(ALLOWED_USER_FIELDS).where({ email: user }).first().then(data => {
      if (!data) {
        resolve(null)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Delete a user.
 */
async function deleteOne(email) {
  return new Promise((resolve, reject) => {
    const db = knex.masterDb()
    db('users').select('id').where({ email }).first().then(async (user) => {
      if (!user) {
        reject(new Error(`User ${email} does not exist.`))
      } else {
        await db('database_users').where({ user_id: user.id }).delete()
        await db('users').where({ id: user.id }).delete()
        resolve(true)
      }
    })
  })
}

/**
 * Get the databases user has an access.
 */
async function databases(email) {
  const db = knex.masterDb()
  const user: UserDataModel | null = await getOne(email)
  if (!user) {
    return []
  }
  const dbUsers = await db('database_users').select('database_id').where({ user_id: user.id })
  const ids = dbUsers.map(db => db.database_id)
  return db('databases').select('id', 'name', 'config', 'created').whereIn('id', ids)
}

export default {
  databases,
  getAll,
  getOne,
  deleteOne,
  hasAdminUser,
  registerUser,
  signToken,
  validateUser,
  verifyPassword,
  verifyToken,
  verifyUser
}
