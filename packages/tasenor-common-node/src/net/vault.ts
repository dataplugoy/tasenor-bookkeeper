import { Secret } from '@dataplug/tasenor-common'
import { randomString } from './crypto'

export const ALLOWED_VAULT_VARIABLES = [
  'TASENOR_API_URL',
  'API_SITE_TOKEN',
  'DATABASE_ROOT_PASSWORD',
  'DATABASE_ROOT_USER',
  'DATABASE_URL',
  'SECRET',
  'ERP_SITE_TOKEN'
]
const validVariables = new Set(ALLOWED_VAULT_VARIABLES)

export type VaultVariable = typeof ALLOWED_VAULT_VARIABLES[number]
export type VaultValue = string

/**
 * Base class for a secret vault implementations.
 */
export class Vault {
  url: string
  values: { [key: string]: VaultValue }
  initialized: boolean
  secret: Secret | null

  constructor(url: string) {
    this.url = url
    this.values = {}
    this.initialized = false
    this.secret = null
  }

  /**
   * Retrieve all secret values.
   */
  async initialize(): Promise<void> {
    throw new Error(`A class ${this.constructor.name} does not implement initialize().`)
  }

  /**
   * Get a secret value.
   * @param variable
   * @returns
   */
  get(variable: VaultVariable, def: undefined | VaultValue = undefined): VaultValue {
    if (!validVariables.has(variable)) throw new Error(`A variable ${variable} is not valid vault value.`)
    if (!(variable in this.values)) {
      if (def !== undefined) {
        return def
      }
      throw new Error(`Cannot find variable ${variable} from the vault.`)
    }
    return this.values[variable]
  }

  /**
   * Get the internally generated secret and generate new if none yet generated.
   */
  getPrivateSecret() {
    if (this.secret === null) {
      this.secret = randomString(512) as Secret
    }
    return this.secret
  }

  /**
   * Set the internal secret (use only in developement).
   */
  setPrivateSecret(secret: Secret): void {
    this.secret = secret
  }
}

/**
 * A secret vault using environment variables only.
 */
export class EnvironmentVault extends Vault {

  async initialize(): Promise<void> {
    for (const variable of ALLOWED_VAULT_VARIABLES) {
      const value = process.env[variable]
      if (value !== undefined) {
        this.values[variable] = value
      }
    }
  }
}

/**
 * Instantiate and return the current vault based on the environment VAULT_URL.
 */
let currentVault: Vault | undefined
export function getVault(): Vault {
  if (currentVault && currentVault.url === process.env.VAULT_URL) return currentVault
  if (!process.env.VAULT_URL) {
    throw new Error('No VAULT_URL set and cannot instantiate the vault.')
  }
  const url = new URL(process.env.VAULT_URL)
  switch (url.protocol) {
    case 'env:':
      currentVault = new EnvironmentVault(process.env.VAULT_URL)
      break
    default:
      throw new Error(`Cannot recognize protocol ${url.protocol} of vault URL ${process.env.VAULT_URL}`)
  }
  return currentVault
}

/**
 * Retrieve a value from the vault.
 * @param variable
 * @returns
 */
function get(variable: VaultVariable, def: undefined | VaultValue = undefined): VaultValue {
  const vault = getVault()
  if (!vault.initialized) {
    throw new Error('Cannot use the vault before it is initialized.')
  }
  const value = vault.get(variable, def)
  if (value === undefined) {
    throw new Error(`Cannot find value ${variable} from the vault.`)
  }
  return value
}

/**
 * Get the internally generated secret and generate new if none yet generated.
 */
function getPrivateSecret(): Secret {
  const vault = getVault()
  if (!vault.initialized) {
    throw new Error('Cannot use the vault before it is initialized.')
  }
  return vault.getPrivateSecret()
}

/**
 * Set the internal secret.
 */
function setPrivateSecret(secret: Secret): void {
  const vault = getVault()
  vault.setPrivateSecret(secret)
}

/**
 * Set up the vault.
 */
async function initialize(): Promise<void> {
  const vault = getVault()
  vault.initialized = true
  await vault.initialize()
}

export const vault = {
  get,
  getPrivateSecret,
  getVault,
  initialize,
  setPrivateSecret
}
