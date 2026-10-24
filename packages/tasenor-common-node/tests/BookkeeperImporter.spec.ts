import { describe, expect, test } from '@jest/globals'
import { ID } from '@tasenor/common'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { BookkeeperImporter } from '../src/database/BookkeeperImporter'
import { TasenorExporter } from '../src/export/TasenorExporter'

describe('BookkeeperImporter', () => {

  test('document numbers are resolved within the period of the date', () => {
    const importer = new BookkeeperImporter()
    importer.periodRanges = [
      { id: 1 as ID, start: '2022-01-01', end: '2022-12-31' },
      { id: 2 as ID, start: '2023-01-01', end: '2023-12-31' }
    ]
    importer.documentIdMapByPeriod = { 1: { 5: 105 as ID }, 2: { 5: 205 as ID } }
    importer.documentIdMap = { 5: 205 as ID }

    expect(importer.documentId(5, '2022-03-01')).toBe(105)
    expect(importer.documentId(5, '2023-01-01')).toBe(205)
    expect(importer.documentId(5)).toBe(205)
    expect(importer.documentId(5, '2030-01-01')).toBe(205)
  })

  test('deeply nested settings keep their full names', async () => {
    const inserted: Record<string, unknown> = {}
    const db = () => ({ insert: async ({ name, value }) => { inserted[name] = JSON.parse(value) } })
    const importer = new BookkeeperImporter()
    await importer.setConfig(db as never, { language: 'fi', a: { b: { c: 1 }, d: 2 } } as never)
    expect(inserted).toStrictEqual({ language: 'fi', 'a.b.c': 1, 'a.d': 2 })
  })

  test('tag pictures are saved into separate files', async () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'tags-'))
    const tags = [
      { tag: 'A', name: 'A', mime: 'image/png', picture: Buffer.from('a'), type: null, order: null },
      { tag: 'B', name: 'B', mime: 'image/png', picture: Buffer.from('b'), type: null, order: null }
    ]
    const db = () => ({ select: () => ({ orderBy: async () => tags }) })
    const lines = await new TasenorExporter().getTags(db as never, out as never)
    const files = lines.slice(1).map(line => line[3])
    expect(new Set(files).size).toBe(2)
    expect(files.map(f => fs.readFileSync(path.join(out, f as string)).toString())).toStrictEqual(['a', 'b'])
    fs.rmSync(out, { recursive: true })
  })

  test('tag pictures must stay inside the backup directory', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'restore-'))
    const secret = path.join(os.tmpdir(), `secret-${path.basename(dir)}.txt`)
    fs.writeFileSync(secret, 'secret')
    fs.mkdirSync(path.join(dir, 'pictures'))
    fs.writeFileSync(path.join(dir, 'pictures', 'A.png'), 'picture')
    const inserted: Record<string, unknown>[] = []
    const db = () => ({ insert: async (entry) => { inserted.push(entry) } })
    const importer = new BookkeeperImporter()

    const header = '# tag\tname\tmime\tpicture\ttype\torder\n'
    fs.writeFileSync(path.join(dir, 'tags.tsv'), header + 'A\tA\timage/png\tpictures/A.png\tT\t1\n')
    await importer.setTags(db as never, path.join(dir, 'tags.tsv') as never)
    expect(inserted.map(e => `${e.picture}`)).toStrictEqual(['picture'])

    fs.writeFileSync(path.join(dir, 'tags.tsv'), header + `B\tB\timage/png\t../${path.basename(secret)}\tT\t2\n`)
    await expect(importer.setTags(db as never, path.join(dir, 'tags.tsv') as never)).rejects.toThrow('Invalid picture path')
    expect(inserted.length).toBe(1)

    fs.symlinkSync(secret, path.join(dir, 'pictures', 'C.png'))
    fs.writeFileSync(path.join(dir, 'tags.tsv'), header + 'C\tC\timage/png\tpictures/C.png\tT\t3\n')
    await expect(importer.setTags(db as never, path.join(dir, 'tags.tsv') as never)).rejects.toThrow('Invalid picture path')
    expect(inserted.length).toBe(1)

    fs.rmSync(dir, { recursive: true })
    fs.rmSync(secret)
  })
})
