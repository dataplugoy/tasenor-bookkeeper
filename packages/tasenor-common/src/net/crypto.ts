import buffer from 'buffer'
import { error } from '../logging'
import { Secret } from '../types'
global.Buffer = global.Buffer || buffer.Buffer

let subtle

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto')
  subtle = crypto.subtle
} catch (err) {
  subtle = crypto.subtle
}

export class Crypto {

  static async generateKey(): Promise<Secret> {
    const key = await subtle.generateKey({
      name: 'AES-GCM',
      length: 256,
    }, true, ['encrypt', 'decrypt'])
    const buf = await subtle.exportKey('raw', key)
    return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('') as Secret
  }

  static async encrypt(key: Secret, clearText: string): Promise<string> {
    return ''
  }
}

/**
 * Utility to encrypt and decrypt passwords.
 */
export class OldCrypto {

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
    // const hash = crypto.createHash('sha1')
    // hash.update(salt)
    this.key = Buffer.from('abcde') // hash.digest().slice(0, 16)
    console.log(this.key)
  }

  /**
   * Encrypt a text.
   * @param clearText Original text.
   * @returns Encrypted text.
   */
  encrypt(clearText: string): string {
    return clearText
    /*
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv)
    const encrypted = cipher.update(clearText, 'utf8', 'hex')
    return [
      encrypted + cipher.final('hex'),
      Buffer.from(iv).toString('hex')
    ].join('|')
    */
  }

  /**
   * Decrypt a text.
   * @param encryptedText Encrypted text.
   * @returns Original text or null on failure.
   */
  decrypt(encryptedText: string): string|null {
    return encryptedText
    /*
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
    */
  }
}
