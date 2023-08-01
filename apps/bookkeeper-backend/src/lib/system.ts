import { Currency, Url, UUID } from '@tasenor/common'
import knex from '../lib/knex'

/**
 * Definition of the system settings.
 */
export interface SystemSettings {
  siteUrl: Url
  currency: Currency
  canRegister: boolean | null
  isEmailConfirmationRequired: boolean | null
  uuid: UUID
}

// Name of the system setting.
export type SystemSettingName = keyof SystemSettings
// Various possibilities for system setting value.
export type SystemSettingValue = null | Url | Currency | boolean | UUID

/**
 * Get all system settings.
 * @returns Object mapping names to values.
 */
async function settings(): Promise<SystemSettings> {
  const db = await knex.masterDb()
  const settings = await db('settings').select('*')
  const result = {}
  for (const setting of settings) {
    result[setting.name] = setting.value
  }
  return result as SystemSettings
}

/**
 * Set one or more system setting.
 * @param settings Setting object or name of the setting.
 */
async function set(settings: Record<SystemSettingName, SystemSettingValue> | SystemSettingName, value: SystemSettingValue | undefined = undefined): Promise<void> {
  if (typeof settings === 'object') {
    for (const [name, value] of Object.entries(settings)) {
      await set(name as SystemSettingName, value)
    }
    return
  }

  const db = await knex.masterDb()
  const name = settings
  const setting = await db('settings').where({ name }).count().first()
  if (setting && parseInt((setting).count + '') > 0) {
    await db('settings').update({ value: JSON.stringify(value) }).where({ name })
  } else {
    await db('settings').insert({ name, value: JSON.stringify(value) })
  }
}

/**
 * Get the value of a system setting.
 * @param name
 */
async function get(name: SystemSettingName): Promise<SystemSettingValue> {
  const db = await knex.masterDb()
  const value = await db('settings').select('value').where({ name }).first()
  return value ? value.value : undefined
}

export default {
  get,
  settings,
  set
}
