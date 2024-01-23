/**
 * Type definitions for time.
 */
import Opaque from 'ts-opaque'

// Common time and date types
// --------------------------
export type Timestamp = Opaque<number, 'Timestamp'>
export function isTimestamp(s: unknown): s is Timestamp {
  return typeof s === 'number' && s >= 0
}
export type Timestring = Opaque<string, 'Timestring'>
export function isTimestring(s: unknown): s is Timestring {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/.test(s)
}
export type ShortDate = string // YYYY-MM-DD
export function isShortDate(s: unknown): s is ShortDate {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}
export type TimeType = Date | Timestamp | Timestring | ShortDate

/**
 * Convert any time type to milliseconds since Epoch. Default to current time.
 */
export function time2number(t: TimeType | undefined = undefined): number {
  if (t === undefined) {
    return new Date().getTime()
  }
  if (t instanceof Date) {
    return t.getTime()
  }
  if (isTimestamp(t)) {
    return t
  }
  return new Date(t).getTime()
}

// Seconds in a minute.
export const MINUTES = 60
// Seconds in an hour.
export const HOURS = MINUTES * 60
// Seconds in a day.
export const DAYS = HOURS * 24
// Seconds in an year.
export const YEARS = DAYS * 365

/**
 * Convert short month text to long.
 * @param abbrev
 */
export function month(abbrev: string): string | null {
  const months = {
    jan: 'January',
    feb: 'February',
    mar: 'March',
    apr: 'April',
    may: 'May',
    jun: 'June',
    jul: 'July',
    aug: 'August',
    sep: 'September',
    oct: 'October',
    nov: 'November',
    dec: 'December'
  }

  return months[abbrev.toLowerCase()] || null
}
