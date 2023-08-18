/**
 * All general purpose types.
 */
import Opaque from 'ts-opaque'

// Primitive values
// ----------------
// TODO: This is bad idea and should get rid of with more accurate definitions everywhere where it is used.
export type Value =
  | null
  | string
  | number
  | boolean
  | { [x: string]: Value }
  | Array<Value>
export type Values = {
  [key: string]: Value
}

export function isValue(obj: unknown): obj is Value {
  return typeof (obj) !== 'function'
}
export function isValues(obj: unknown): obj is Values {
  if (typeof (obj) !== 'object' || obj === null) {
    return false
  }
  for (const k of Object.keys(obj)) {
    if (!isValue(obj[k])) {
      return false
    }
  }
  return true
}

// Common file and format related types
// ------------------------------------
export type DirectoryPath = Opaque<string, 'DirectoryPath'>
export type FilePath = Opaque<string, 'FilePath'>
export type TsvFilePath = FilePath
export type JsonFilePath = FilePath
export type TarFilePath = FilePath
export type SqliteDbPath = FilePath
export type TextFilePath = FilePath
export type ParsedTsvFileData = string[][]
export type ProcessedTsvFileData = {[key: string]: string}[]
export type Json = Value

// Common utility types
// --------------------
export type Constructor<T> = new (...args) => T
export type Language = 'aa' | 'ab' | 'af' | 'ak' | 'am' | 'an' | 'ar' | 'as' | 'av' | 'ay' | 'az' | 'ba' | 'be' | 'bg' | 'bh' | 'bi' | 'bm' | 'bn' | 'bo' | 'br' | 'bs' | 'ca' | 'ce' | 'ch' | 'co' | 'cr' | 'cs' | 'cu' | 'cv' | 'cy' | 'da' | 'de' | 'dv' | 'dz' | 'ee' | 'el' | 'en' | 'eo' | 'es' | 'et' | 'eu' | 'fa' | 'ff' | 'fi' | 'fj' | 'fo' | 'fr' | 'fy' | 'ga' | 'gd' | 'gl' | 'gn' | 'gu' | 'gv' | 'ha' | 'he' | 'hi' | 'ho' | 'hr' | 'ht' | 'hu' | 'hy' | 'hz' | 'ia' | 'id' | 'ie' | 'ig' | 'ii' | 'ik' | 'io' | 'is' | 'it' | 'iu' | 'ja' | 'jv' | 'kg' | 'ki' | 'kj' | 'kk' | 'kl' | 'km' | 'kn' | 'ko' | 'kr' | 'ks' | 'ku' | 'kv' | 'kw' | 'ky' | 'la' | 'lb' | 'lg' | 'li' | 'ln' | 'lo' | 'lt' | 'lv' | 'mg' | 'mh' | 'mi' | 'mk' | 'ml' | 'mn' | 'mo' | 'mr' | 'ms' | 'mt' | 'my' | 'na' | 'nd' | 'ne' | 'ng' | 'nl' | 'nn' | 'no' | 'nr' | 'nv' | 'ny' | 'oc' | 'oj' | 'om' | 'or' | 'os' | 'pa' | 'pi' | 'pl' | 'ps' | 'pt' | 'qu' | 'rm' | 'rn' | 'ro' | 'ru' | 'rw' | 'sa' | 'sc' | 'sd' | 'sg' | 'sh' | 'si' | 'sk' | 'sl' | 'sm' | 'sn' | 'so' | 'sq' | 'sr' | 'ss' | 'st' | 'su' | 'sv' | 'sw' | 'ta' | 'te' | 'tg' | 'th' | 'ti' | 'tk' | 'tl' | 'tn' | 'to' | 'tr' | 'ts' | 'tt' | 'tw' | 'ty' | 'ug' | 'ur' | 've' | 'vi' | 'vo' | 'wa' | 'wo' | 'xh' | 'yi' | 'yo' | 'za' | 'zh' | 'zu'
export const languages = new Set([
  'aa', 'ab', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az', 'ba', 'be', 'bg', 'bh', 'bi', 'bm', 'bn', 'bo', 'br', 'bs', 'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy', 'da', 'de', 'dv', 'dz', 'ee', 'el', 'en', 'eo', 'es', 'et', 'eu', 'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy', 'ga', 'gd', 'gl', 'gn', 'gu', 'gv', 'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz', 'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu', 'ja', 'jv', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky', 'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lv', 'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mo', 'mr', 'ms', 'mt', 'my', 'na', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny', 'oc', 'oj', 'om', 'or', 'os', 'pa', 'pi', 'pl', 'ps', 'pt', 'qu', 'rm', 'rn', 'ro', 'ru', 'rw', 'sa', 'sc', 'sd', 'sg', 'sh', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty', 'ug', 'ur', 've', 'vi', 'vo', 'wa', 'wo', 'xh', 'yi', 'yo', 'za', 'zh', 'zu'
])
export function isLanguage(s: unknown): s is Language {
  return typeof s === 'string' && languages.has(s)
}
export type Currency = 'AFN' | 'ALL' | 'DZD' | 'ARS' | 'AMD' | 'AUD' | 'AZN' | 'BHD' | 'BDT' | 'BYN' | 'BZD' | 'BOB' | 'BAM' | 'BWP' | 'BRL' | 'GBP' | 'BND' | 'BGN' | 'BIF' | 'KHR' | 'CAD' | 'CVE' | 'XAF' | 'CLP' | 'CNY' | 'COP' | 'KMF' | 'CDF' | 'CRC' | 'HRK' | 'CZK' | 'DKK' | 'DJF' | 'DOP' | 'EGP' | 'ERN' | 'EEK' | 'ETB' | 'EUR' | 'GEL' | 'GHS' | 'GTQ' | 'GNF' | 'HNL' | 'HKD' | 'HUF' | 'ISK' | 'INR' | 'IDR' | 'IRR' | 'IQD' | 'ILS' | 'JMD' | 'JPY' | 'JOD' | 'KZT' | 'KES' | 'KWD' | 'LVL' | 'LBP' | 'LYD' | 'LTL' | 'MOP' | 'MKD' | 'MGA' | 'MYR' | 'MUR' | 'MXN' | 'MDL' | 'MAD' | 'MZN' | 'MMK' | 'NAD' | 'NPR' | 'TWD' | 'NZD' | 'NIO' | 'NGN' | 'NOK' | 'OMR' | 'PKR' | 'PAB' | 'PYG' | 'PEN' | 'PHP' | 'PLN' | 'QAR' | 'RON' | 'RUB' | 'RWF' | 'SAR' | 'RSD' | 'SGD' | 'SOS' | 'ZAR' | 'KRW' | 'LKR' | 'SDG' | 'SEK' | 'CHF' | 'SYP' | 'TZS' | 'THB' | 'TOP' | 'TTD' | 'TND' | 'TRY' | 'USD' | 'UGX' | 'UAH' | 'AED' | 'UYU' | 'UZS' | 'VEF' | 'VND' | 'XOF' | 'YER' | 'ZMK' | 'ZWL'

export const currencies = new Set([
  'AFN', 'ALL', 'DZD', 'ARS', 'AMD', 'AUD', 'AZN', 'BHD', 'BDT', 'BYN', 'BZD', 'BOB', 'BAM', 'BWP', 'BRL', 'GBP', 'BND', 'BGN', 'BIF', 'KHR', 'CAD', 'CVE', 'XAF', 'CLP', 'CNY', 'COP', 'KMF', 'CDF', 'CRC', 'HRK', 'CZK', 'DKK', 'DJF', 'DOP', 'EGP', 'ERN', 'EEK', 'ETB', 'EUR', 'GEL', 'GHS', 'GTQ', 'GNF', 'HNL', 'HKD', 'HUF', 'ISK', 'INR', 'IDR', 'IRR', 'IQD', 'ILS', 'JMD', 'JPY', 'JOD', 'KZT', 'KES', 'KWD', 'LVL', 'LBP', 'LYD', 'LTL', 'MOP', 'MKD', 'MGA', 'MYR', 'MUR', 'MXN', 'MDL', 'MAD', 'MZN', 'MMK', 'NAD', 'NPR', 'TWD', 'NZD', 'NIO', 'NGN', 'NOK', 'OMR', 'PKR', 'PAB', 'PYG', 'PEN', 'PHP', 'PLN', 'QAR', 'RON', 'RUB', 'RWF', 'SAR', 'RSD', 'SGD', 'SOS', 'ZAR', 'KRW', 'LKR', 'SDG', 'SEK', 'CHF', 'SYP', 'TZS', 'THB', 'TOP', 'TTD', 'TND', 'TRY', 'USD', 'UGX', 'UAH', 'AED', 'UYU', 'UZS', 'VEF', 'VND', 'XOF', 'YER', 'ZMK', 'ZWL'
])
export function isCurrency(s: unknown): s is Currency {
  return typeof s === 'string' && currencies.has(s)
}

export type Version = Opaque<string, 'Version'>
export function isVersion(s: unknown): s is Version {
  return typeof s === 'string' && /^\d+(\.\d+)+$/.test(s)
}
export function versionCompare(a: Version, b: Version): 1 | 0 |-1 {
  const verA = a.split('.')
  const verB = b.split('.')
  const N = Math.max(verA.length, verB.length)
  for (let i = 0; i < N; i++) {
    const diff = parseInt(verA[i]) - parseInt(verB[i])
    if (diff < 0) return -1
    if (diff > 0) return 1
  }
  if (verA.length < verB.length) return -1
  if (verA.length > verB.length) return 1
  return 0
}
export function latestVersion(versions: Array<Version>): Version | null {
  if (versions.length === 0) {
    return null
  }
  let best
  for (const version of versions) {
    if (!best || versionCompare(version, best) > 0) {
      best = version
    }
  }
  return best
}

export type UUID = Opaque<string, 'UUID'>
export type Email = Opaque<string, 'Email'>

// Data storages
// -------------
export type DatabaseName = Opaque<string, 'DatabaseName'>
export type PK = Opaque<number, 'PK'>

export const isDatabaseName = (name: unknown): name is DatabaseName => {
  return typeof name === 'string' && /^[_a-z0-9]+$/.test(name)
}
