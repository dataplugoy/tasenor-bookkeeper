/**
 * Type definitions for time.
 */
import Opaque from 'ts-opaque'

// Common time and date types
// --------------------------
export type Timestamp = Opaque<number, 'TimeStamp'>
export type ShortDate = string // YYYY-MM-DD
export function isShortDate(s: unknown): s is ShortDate {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
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
