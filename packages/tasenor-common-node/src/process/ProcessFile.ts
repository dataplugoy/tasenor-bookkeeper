import { ID, FileEncoding } from '@dataplug/tasenor-common'
import chardet from 'chardet'
import clone from 'clone'
import { KnexDatabase } from '../database'
import { DatabaseError, InvalidFile, NotImplemented } from '../error'

/**
 * A data structure containing input data for the process.
 */
export interface ProcessFileData {
  processId?: ID
  name: string
  type?: string
  encoding: FileEncoding
  data: string
}

/**
 * An instance of input data for processing.
 */
export class ProcessFile {
  id: ID
  processId: ID
  name: string
  type?: string
  encoding: FileEncoding
  data: string
  _decoded?: string

  constructor(obj: ProcessFileData) {
    this.id = null
    this.processId = obj.processId || null
    this.name = obj.name
    this.type = obj.type
    this.encoding = obj.encoding
    this.data = obj.data
    this._decoded = undefined
  }

  toString(): string {
    return `ProcessFile #${this.id} ${this.name}`
  }

  /**
   * Get the loaded process information as JSON object.
   * @returns
   */
  toJSON(): ProcessFileData {
    return {
      processId: this.processId,
      name: this.name,
      type: this.type,
      encoding: this.encoding,
      data: this.data
    }
  }

  /**
   * Save the file to the database.
   */
  async save(db: KnexDatabase): Promise<ID> {
    const out = this.toJSON()
    if (this.encoding === 'json') {
      out.data = JSON.stringify(out.data)
    }
    if (this.id) {
      await db('process_files').update(out).where({ id: this.id })
      return this.id
    } else {
      this.id = (await db('process_files').insert(out).returning('id'))[0].id
      if (this.id) return this.id
      throw new DatabaseError(`Saving process ${JSON.stringify(out)} failed.`)
    }
  }

  /**
   * Check if the first line of the text file matches to the regular expression.
   * @param re
   */
  firstLineMatch(re: RegExp): boolean {
    const str = this.decode()
    const n = str.indexOf('\n')
    const line1 = n < 0 ? str : str.substr(0, n).trim()
    return re.test(line1)
  }

  /**
   * Check if the second line of the text file matches to the regular expression.
   * @param re
   */
  secondLineMatch(re: RegExp): boolean {
    const lines = this.decode().split('\n')
    return lines.length > 1 && re.test(lines[1].trim())
  }

  /**
   * Check if the third line of the text file matches to the regular expression.
   * @param re
   */
  thirdLineMatch(re: RegExp): boolean {
    const lines = this.decode().split('\n')
    return lines.length > 2 && re.test(lines[2].trim())
  }

  /**
   * Check if the file begins with the given string.
   */
  startsWith(s: string): boolean {
    let buffer
    switch (this.encoding) {
      case 'base64':
        buffer = Buffer.from(this.data.substring(0, s.length * 2), 'base64')
        return buffer.toString('ascii').substr(0, s.length) === s
      default:
        throw new NotImplemented(`Cannot handle encoding ${this.encoding} in startWith().`)
    }
  }

  /**
   * Find out if the content is binary or text.
   *
   * The mime type has to start with `text/`.
   */
  isTextFile(): boolean {
    return this.type?.startsWith('text/') || false
  }

  /**
   * Convert chardet encoding to the supported buffer encoding
   * "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex"
   */
  parseEncoding(encoding: string): 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex' {
    switch (encoding.toUpperCase()) {
      case 'UTF-8':
        return 'utf-8'
      case 'ISO-8859-1':
        return 'latin1'
      case 'UTF-16LE':
        return 'utf16le'
      default:
        throw new InvalidFile(`Not able to map text encoding ${encoding}.`)
    }
  }

  /**
   * Try to recognize the file content and decode if it is a recognizable text format.
   */
  decode(): string {
    if (this._decoded) {
      return this._decoded
    }
    if (this.encoding === 'base64') {
      const buffer = Buffer.from(this.data, 'base64')
      const encoding = chardet.detect(buffer)
      if (!encoding) {
        throw new InvalidFile(`Cannot determine encoding for '${this}'.`)
      }
      this._decoded = buffer.toString(this.parseEncoding(encoding))
      return this._decoded
    }

    if (this.encoding === 'utf-8') {
      this._decoded = clone(this.data)
      return this._decoded || ''
    }

    throw new InvalidFile(`An encoding '${this.encoding}' is not yet supported.`)
  }
}
