/**
 * This is knexfile for the master database for Bookkeeping.
 */
const path = require('path')

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.')
}

const url = new URL(process.env.DATABASE_URL)
if (url.protocol !== 'postgresql:') {
  throw new Error(`Cannot handle DATABASE_URL protocol ${url.protocol}.`)
}

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: url.hostname,
      port: parseInt(url.port),
      database: url.pathname.replace(/\//, ''),
      user: url.username,
      password: url.password
    },
    pool: {
      min: 1,
      max: 1
    },
    migrations: {
      directory: path.join(__dirname, 'migrations-master')
    },
    seeds: {
      directory: path.join(__dirname, 'seeds-master')
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host: url.hostname,
      port: parseInt(url.port),
      database: url.pathname.replace(/\//, ''),
      user: url.username,
      password: url.password
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.join(__dirname, 'migrations-master')
    },
    seeds: {
      directory: path.join(__dirname, 'seeds-master')
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      host: url.hostname,
      port: parseInt(url.port),
      database: url.pathname.replace(/\//, ''),
      user: url.username,
      password: url.password
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: path.join(__dirname, 'migrations-master')
    },
    seeds: {
      directory: path.join(__dirname, 'seeds-master')
    }
  }
}
