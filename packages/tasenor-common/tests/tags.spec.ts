import { expect, test } from '@jest/globals'
import { Tag, isTagString, mergeTags } from '../src/types/bookkeeper/tags'

test('Tags', () => {
  expect(mergeTags('[A] Hello', ['A' as Tag])).toBe('[A] Hello')
  expect(mergeTags('[A][B] Hello', ['A' as Tag])).toBe('[A][B] Hello')
  expect(mergeTags('[B] Hello', ['A' as Tag])).toBe('[A][B] Hello')
  expect(mergeTags('[B] Hello', ['C' as Tag, 'A' as Tag])).toBe('[A][B][C] Hello')
  expect(mergeTags('', ['A' as Tag])).toBe('[A]')
  expect(mergeTags('Hello', ['A' as Tag])).toBe('[A] Hello')
  expect(mergeTags('', [])).toBe('')
  expect(mergeTags('Hello', [])).toBe('Hello')

  expect(mergeTags('[A] Hello', '')).toBe('[A] Hello')
  expect(mergeTags('Hello', '[A] ')).toBe('[A] Hello')
  expect(mergeTags('[A] Hello', '[B]')).toBe('[A][B] Hello')
  expect(mergeTags('[A] Hello', '[A][C][B]')).toBe('[A][B][C] Hello')
})

test('Tag strings', () => {
  expect(isTagString('[A]')).toBe(true)
  expect(isTagString('[A][B2][Cc]')).toBe(true)
  expect(isTagString('[]')).toBe(false)
  expect(isTagString('[A][]')).toBe(false)
  expect(isTagString('[A B]')).toBe(false)
  expect(isTagString('[A] Hello')).toBe(false)
  expect(isTagString('A')).toBe(false)
  expect(isTagString('')).toBe(false)
  expect(isTagString(null)).toBe(false)
})
