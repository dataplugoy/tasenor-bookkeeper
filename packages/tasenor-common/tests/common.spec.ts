import { expect, test } from '@jest/globals'
import { isValues } from '../src'

test('atom values', () => {
  expect(isValues({ a: 12, b: true })).toBe(true)
  expect(isValues([])).toBe(true)
  expect(isValues([false])).toBe(true)
  expect(isValues({ a: () => null })).toBe(false)
  expect(isValues([() => null])).toBe(false)
})
