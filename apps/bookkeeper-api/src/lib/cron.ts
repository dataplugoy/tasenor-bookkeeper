import { DatabaseName, Hostname, error, log } from '@tasenor/common'
import { DB } from '@tasenor/common-node'
import dayjs from 'dayjs'
import cron, { ScheduledTask } from 'node-cron'
import catalog from './catalog'
import knex from './knex'

let houryTask: ScheduledTask
let dailyTask: ScheduledTask

/**
 * Runner for hourly cron for every plugin.
 */
async function hourly(): Promise<void> {
  log('Running hourly cron.')
  const start = new Date().getTime()

  const hour = dayjs().hour()
  await catalog.forEach(async plugin => {
    try {
      await plugin.hourly(hour)
    } catch (err) {
      error(`Hourly cron of plugin ${plugin.code} failed:`, err)
    }
  })

  const stop = new Date().getTime()
  log(`Hourly cron executed in ${(stop - start) / 1000} seconds.`)
}

/**
 * Runner for daily cron for all plugins.
 */
async function nightly(): Promise<void> {
  log('Running nightly cron.')
  const start = new Date().getTime()

  // A failure in one database or plugin must not prevent running the rest.
  for (const name of await knex.allDbs()) {
    let db
    try {
      db = await DB.get(knex.masterDb(), name as DatabaseName, process.env.DB_HOST_OVERRIDE as Hostname)
    } catch (err) {
      error(`Nightly cron cannot connect database ${name}:`, err)
      continue
    }
    // TODO: Check subscription validity first.
    await catalog.forEach(async plugin => {
      try {
        await plugin.nightly(db)
      } catch (err) {
        error(`Nightly cron of plugin ${plugin.code} failed for database ${name}:`, err)
      }
    })
  }

  const stop = new Date().getTime()
  log(`Nightly cron executed in ${(stop - start) / 1000} seconds.`)
}

/**
 * Set up cron tasks.
 */
function initialize(): void {
  log('Initializing cron sub-system.')

  houryTask = cron.schedule('0 * * * *', async () => {
    return hourly()
  })

  dailyTask = cron.schedule('30 2 * * *', async () => {
    return nightly()
  })
}

/**
 * Stop all cron tasks.
 */
function stop(): void {
  houryTask && houryTask.stop()
  dailyTask && dailyTask.stop()
}

export default {
  initialize,
  stop
}
