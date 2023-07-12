import { DatabaseName, Hostname, log } from '@dataplug/tasenor-common'
import { DB } from '@dataplug/tasenor-common-node'
import dayjs from 'dayjs'
import cron from 'node-cron'
import catalog from './catalog'
import knex from './knex'

async function hourly() {
  log('Running hourly cron.')
  const start = new Date().getTime()

  await catalog.forEach(async plugin => await plugin.hourly(dayjs().hour()))

  const stop = new Date().getTime()
  log(`Hourly cron executed in ${(stop - start) / 1000} seconds.`)
}

async function nightly() {
  log('Running nightly cron.')
  const start = new Date().getTime()

  for (const name of await knex.allDbs()) {
    const db = await DB.get(knex.masterDb(), name as DatabaseName, process.env.DB_HOST_OVERRIDE as Hostname)
    // TODO: Check subscription validity first.
    await catalog.forEach(async plugin => await plugin.nightly(db))
  }

  const stop = new Date().getTime()
  log(`Nightly cron executed in ${(stop - start) / 1000} seconds.`)
}

function initialize() {
  log('Initializing cron sub-system.')

  cron.schedule('0 * * * *', async () => {
    return hourly()
  })

  cron.schedule('30 2 * * *', async () => {
    return nightly()
  })
}

export default {
  initialize
}
