/**
 * Types related to user and login.
 */
import { Email } from './common'

declare class Decimal {}

/**
 * Plugin cost model.
 * * `COMPULSORY` - Always installed for free and cannot be removed.
 * * `RECOMMENDED` - Recommended and installe by default for free.
 * * `FREE` - Can be installed for free.
 * * `MONTHLY` - Paid monthly fee.
 * * `SINGLE` - Once off payment for use.
 */
export type PricingModel = 'COMPULSORY' | 'RECOMMENDED' | 'FREE' | 'MONTHLY' | 'SINGLE'

/**
 * A subscription information concerning one plugin.
 */
export interface LoginSubscriptionData {
  model: PricingModel,
  price: Decimal | null,
  billable: Date,
  expires: Date,
  pluginId: number
}

/**
 * Information about pricing for subscription.
 */
export interface LoginPriceData {
  pluginId: number,
  model: PricingModel,
  price: Decimal | null
}

/**
 * Plugin information for login.
 */
export interface LoginPluginData {
  plugins: number[],
  subscriptions: LoginSubscriptionData[]
  prices: LoginPriceData[]
}

/**
 * A data structure send to the UI of the logged in user.
 */
export type LoginData = {
  id: number,
  email: Email,
} & LoginPluginData

/**
 * Simply encrypted user data stored on browser.
 */
export interface EncryptedUserData {
  key: string
  data: string
}
