import buffer from 'buffer'
import { Secret } from '../types'
global.Buffer = global.Buffer || buffer.Buffer

function getCrypto() {
  try {
    return window.crypto
  } catch {
    return require('crypto')
  }
}

export class Crypto {

  /**
   * Convert array buffer to hex encoded string.
   */
  static buf2hex(buf: ArrayBuffer): string {
    return Buffer.from(buf).toString('hex')
  }

  /**
   * Convert hex encoded string to array buffer.
   */
  static hex2buf(hex: string): ArrayBuffer {
    // TODO: Fox broken type.
    return Buffer.from(hex, 'hex') as unknown as ArrayBuffer
  }

  /**
   * Create an encryption key as a hex string.
   */
  static async generateKey(): Promise<Secret> {
    const key = await getCrypto().subtle.generateKey({
      name: 'AES-GCM',
      length: 256,
    }, true, ['encrypt', 'decrypt'])

    const buf = await getCrypto().subtle.exportKey('raw', key)

    return Crypto.buf2hex(buf) as Secret
  }

  /**
   * Helper to generate IV for encryption.
   */
  static generateIv() {
    return getCrypto().getRandomValues(new Uint8Array(12))
  }

  /**
   * Encrypt the given string with the key.
   */
  static async encrypt(secret: Secret, clearText: string): Promise<string> {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(clearText)
    const iv = Crypto.generateIv()
    const key = await getCrypto().subtle.importKey('raw', Crypto.hex2buf(secret), {
      name: 'AES-GCM',
      length: 256,
    }, true, ['encrypt', 'decrypt'])

    const cipher = await getCrypto().subtle.encrypt({
      name: 'AES-GCM',
      iv,
    }, key, encoded)

    return Crypto.buf2hex(cipher) + '|' + Crypto.buf2hex(iv)
  }

  /**
   * Decrypt the given cipher text with the key.
   */
  static async decrypt(secret: Secret, cipherText: string): Promise<string> {
    const [cipher, ivText] = cipherText.split('|')
    if (!ivText) throw new Error('IV not found when decrypting.')
    const iv = Crypto.hex2buf(ivText)
    const text = Crypto.hex2buf(cipher)
    const key = await getCrypto().subtle.importKey('raw', Crypto.hex2buf(secret), {
      name: 'AES-GCM',
      length: 256,
    }, true, ['encrypt', 'decrypt'])

    const decoded = await getCrypto().subtle.decrypt({
      name: 'AES-GCM',
      iv,
    }, key, text)

    const decoder = new TextDecoder()
    return decoder.decode(decoded)
  }
}
