import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { Crypto, EncryptedUserData, LoginPluginData, Secret, UUID } from '@tasenor/common'

/**
 * Utility to create and check hashes from passwords.
 */
export class Password {

  /**
   * Create one way hash for a password.
   * @param password A password.
   * @returns
   */
  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(13)
    const hash = await bcrypt.hash(password, salt)
    return hash
  }

  /**
   * Verify that given hash has been created from the given password.
   * @param password
   * @param hash
   * @returns
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }
}

/**
 * Generate a random string of the given length.
 * @param len
 */
export function randomString(len = 32): string {
  const buf = crypto.randomBytes(len / 2)
  return buf.toString('hex')
}

/**
 * Generate UUID.
 * @returns A string.
 */
export function createUuid(): UUID {
  function randomDigit() {
    const rand = crypto.randomBytes(1)
    return (rand[0] % 16).toString(16)
  }

  return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/x/g, randomDigit) as UUID
}

/**
 * Encode UI data for user.
 */
export async function encryptdata({ plugins, prices, subscriptions }: LoginPluginData): Promise<EncryptedUserData> {
  const result = {
    key: await Crypto.generateKey(),
    data: ''
  }
  const data = {
    plugins,
    prices,
    subscriptions
  }
  result.data = await Crypto.encrypt(result.key as Secret, JSON.stringify(data))
  return result
}
