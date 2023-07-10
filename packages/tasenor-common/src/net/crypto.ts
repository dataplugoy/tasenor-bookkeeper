import crypto from 'crypto'
import buffer from 'buffer'
import { error } from '../logging'
import { Secret } from '../types'
global.Buffer = global.Buffer || buffer.Buffer

/**
 * Utility to encrypt and decrypt passwords.
 */
export class Crypto {

  algorithm: string
  key: Buffer

  /**
   * Create new encrypt/decrypt helper with the given secret.
   * @param encryptionKey The secret.
   */
  constructor(encryptionKey: Secret) {
    if (!encryptionKey || encryptionKey.length < 32) {
      throw new Error('Encryption key is too short or does not exist.')
    }
    this.algorithm = 'aes-128-cbc'
    const salt = encryptionKey
    const hash = crypto.createHash('sha1')
    hash.update(salt)
    this.key = hash.digest().slice(0, 16)
  }

  /**
   * Encrypt a text.
   * @param clearText Original text.
   * @returns Encrypted text.
   */
  encrypt(clearText: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    const encrypted = cipher.update(clearText, 'utf8', 'hex')
    return [
      encrypted + cipher.final('hex'),
      Buffer.from(iv).toString('hex')
    ].join('|')
  }

  /**
   * Decrypt a text.
   * @param encryptedText Encrypted text.
   * @returns Original text or null on failure.
   */
  decrypt(encryptedText: string): string|null {
    const [encrypted, iv] = encryptedText.split('|')
    if (!iv) throw new Error('IV not found when decrypting.')
    let decipher
    try {
      decipher = crypto.createDecipheriv(
        this.algorithm,
        this.key,
        Buffer.from(iv, 'hex')
      )
      return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
    } catch (err) {
      error(`Decrypting ${encryptedText} failed.`)
      return null
    }
  }

  /**
   * Construct a random hash as a hex encoded string.
   * @param len
   * @returns
   */
  static hash(len: number): string {
    return crypto.randomBytes(len).toString('hex')
  }
}
