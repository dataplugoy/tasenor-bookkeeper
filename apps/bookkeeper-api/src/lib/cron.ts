import { DatabaseName, Hostname, log } from '@tasenor/common'
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

  await catalog.forEach(async plugin => await plugin.hourly(dayjs().hour()))

  const stop = new Date().getTime()
  log(`Hourly cron executed in ${(stop - start) / 1000} seconds.`)
}

/**
 * Runner for daily cron for all plugins.
 */
async function nightly(): Promise<void> {
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
