/**
 * Authenticated encryption of small JSON payloads into URL-safe strings (AES-256-GCM).
 *
 * OAuth tokens issued by this server are sealed payloads rather than database rows: nothing to
 * store, nothing lost on restart, and a token cannot be read or altered without the secret.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

export class Sealer {
  private key: Buffer

  constructor (secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error('MCP_SECRET must be at least 32 characters.')
    }
    this.key = createHash('sha256').update(`tasenor-mcp:${secret}`).digest()
  }

  seal (payload: object): string {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.key, iv)
    const data = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
    return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url')
  }

  /**
   * The payload, or null if the string was not sealed with this secret or has been tampered with.
   */
  open<T = Record<string, unknown>> (sealed: string): T | null {
    try {
      const raw = Buffer.from(sealed, 'base64url')
      if (raw.length < 29) {
        return null
      }
      const decipher = createDecipheriv('aes-256-gcm', this.key, raw.subarray(0, 12))
      decipher.setAuthTag(raw.subarray(12, 28))
      const data = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()])
      return JSON.parse(data.toString('utf8')) as T
    } catch {
      return null
    }
  }
}
