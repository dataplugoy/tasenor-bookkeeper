/**
 * General purpose logging and debugging interface for all Tasenor code.
 *
 * @module tasenor-common/src/logging
 */
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { isUi } from './utils'

dayjs.extend(utc)

let muted = false
const colors = !isUi()

/**
 * Various independently on/off togglable debugging message channels.
 *
 * * `STOCK` - Debug changes in assets.
 * * `BALANCE` - Debug changes in account balances.
 * * `RULES` - Debug how rule filters and results are evaluated.
 * * `SEGMENTATION` - Debug results of the segmentation.
 * * `CLASSIFICATION` - Debug results of the classification.
 * * `ANALYSIS` - Debug transfer results of the analysis.
 * * `EXECUTION` - Debug process of execution.
 *
 * These can be set with by setting environment `DEBUG_<name>` to `yes`.
 */
export type DebugChannel = 'STOCK' | 'BALANCE' | 'RULES' | 'SEGMENTATION' | 'CLASSIFICATION' | 'ANALYSIS' | 'EXECUTION'

// Which channels are on?
const debugChannels = (): Record<DebugChannel, boolean> => {
  return isUi() ? {
    STOCK: 'DEBUG_STOCK' in window && window['DEBUG_STOCK'] === 'yes',
    BALANCE: 'DEBUG_BALANCE' in window && window['DEBUG_BALANCE'] === 'yes',
    RULES: 'DEBUG_RULES' in window && window['DEBUG_RULES'] === 'yes',
    SEGMENTATION: 'DEBUG_SEGMENTATION' in window && window['DEBUG_SEGMENTATION'] === 'yes',
    CLASSIFICATION: 'DEBUG_CLASSIFICATION' in window && window['DEBUG_CLASSIFICATION'] === 'yes',
    ANALYSIS: 'DEBUG_ANALYSIS' in window && window['DEBUG_ANALYSIS'] === 'yes',
    EXECUTION: 'DEBUG_EXECUTION' in window && window['DEBUG_EXECUTION'] === 'yes'
  } : {
    STOCK: process.env.DEBUG_STOCK === 'yes' || false,
    BALANCE: process.env.DEBUG_BALANCE === 'yes' || false,
    RULES: process.env.DEBUG_RULES === 'yes' || false,
    SEGMENTATION: process.env.DEBUG_SEGMENTATION === 'yes' || false,
    CLASSIFICATION: process.env.DEBUG_CLASSIFICATION === 'yes' || false,
    ANALYSIS: process.env.DEBUG_ANALYSIS === 'yes' || false,
    EXECUTION: process.env.DEBUG_EXECUTION === 'yes' || false
  }
}

let channelsDisplayed = false
function displayChannels() {
  if (channelsDisplayed) return
  channelsDisplayed = true
  const channels = debugChannels()
  if (Object.values(channels).filter(flag => flag).length === 0) {
    return
  }
  for (const channel of ['STOCK', 'RULES', 'SEGMENTATION', 'CLASSIFICATION', 'ANALYSIS', 'EXECUTION']) {
    console.log(`\u001b[93mDEBUG_${channel} = ${channels[channel] ? 'yes' : 'no'}\u001b[0m`)
  }
}

/**
 * Check if the logging is muted.
 * @returns
 */
function isMuted(): boolean {
  if (isUi()) {
    return !('DEBUG' in window)
  }
  return muted
}

/**
 * Construct UTC timestamp to display for logs.
 * @param stamp
 * @returns
 */
export function timestamp(stamp: Date = new Date()): string {
  if (isUi()) return dayjs.utc(stamp).format('HH:mm:ss')
  return dayjs.utc(stamp).format('YYYY-MM-DDTHH:mm:ssZ')
}

function ansi(color: 'info' | 'note' | 'warning' | 'error' | 'reset'): string {
  if (!colors) {
    return ''
  }
  switch (color) {
    case 'info':
      return '\u001b[32m'
    case 'note':
      return '\u001b[33m'
    case 'warning':
      return '\u001b[34m'
    case 'error':
      return '\u001b[31m'
    case 'reset':
      return '\u001b[0m'
  }
}

/**
 * Log informative line to the console.
 * @param args
 */
// eslint-disable-next-line
export function log(...args: any[]): void {
  if (isMuted()) return
  console.log(ansi('info') + timestamp(), ...args, ansi('reset'))
}

/**
 * Log informative line with notification color to the console.
 * @param args
 */
// eslint-disable-next-line
export function note(...args: any[]): void {
  if (isMuted()) return
  console.log(ansi('note') + timestamp(), ...args, ansi('reset'))
}

/**
 * Log warning line to the console.
 * @param args
 */
// eslint-disable-next-line
export function warning(...args: any[]): void {
  if (isMuted()) return
  console.warn(ansi('warning') + timestamp(), ...args, ansi('reset'))
}

/**
 * Log error line to the console.
 * @param args
 */
// eslint-disable-next-line
export function error(...args: any[]): void {
  if (isMuted()) return
  console.error(ansi('error') + timestamp(), ...args, ansi('reset'))
}

/**
 * Silence all logging (for testi runs mainly).
 */
export function mute(): void {
  muted = true
}

/**
 * Restore normal logging after silencing.
 */
export function unmute(): void {
  muted = false
}

/**
 * Dump values if debug channel is enabled.
 * @param channel
 * @param args
 */
export function debug(channel: DebugChannel, ...args) {
  displayChannels()
  const channels = debugChannels()
  if (!channels[channel]) {
    return
  }
  const allString = args.every(arg => typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean' || arg === null)
  if (allString) {
    console.log('\u001b[35m' + args.join(' ') + '\u001b[0m')
  } else {
    for (const arg of args) {
      console.dir(arg, { depth: null, maxArrayLength: null })
    }
  }
}
