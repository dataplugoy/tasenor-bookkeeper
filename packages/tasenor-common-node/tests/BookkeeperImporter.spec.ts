import { describe, expect, test } from '@jest/globals'
import { ID } from '@tasenor/common'
import { BookkeeperImporter } from '../src/database/BookkeeperImporter'

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
})
