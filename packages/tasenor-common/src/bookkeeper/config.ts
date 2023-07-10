import { BookkeeperConfig } from '../types'

/**
 * Create empty configuration.
 * @returns Configuration.
 */
const createConfig = (): BookkeeperConfig => {
  return {
    scheme: null,
    schemeVersion: null,
    companyName: null,
    companyCode: null,
    language: null,
    currency: null
  }
}

export const Bookkeeper = {
  createConfig
}
