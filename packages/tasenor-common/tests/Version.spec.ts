import { expect, test } from '@jest/globals'
import { latestVersion, Version, versionCompare } from '../src'

test('Version comparison', async () => {
  expect(versionCompare('0.0' as Version, '0.1' as Version)).toBe(-1)
  expect(versionCompare('0.2' as Version, '0.2' as Version)).toBe(0)
  expect(versionCompare('0.2' as Version, '0.1' as Version)).toBe(1)

  expect(versionCompare('1.0.0' as Version, '1.0.1' as Version)).toBe(-1)
  expect(versionCompare('1.0.2' as Version, '1.0.2' as Version)).toBe(0)
  expect(versionCompare('1.0.2' as Version, '1.0.1' as Version)).toBe(1)

  expect(versionCompare('1.55.0.8' as Version, '1.55.1.1' as Version)).toBe(-1)
  expect(versionCompare('1.55.2.1' as Version, '1.55.2.1' as Version)).toBe(0)
  expect(versionCompare('1.55.2.8' as Version, '1.55.1.1' as Version)).toBe(1)

  expect(versionCompare('1.0' as Version, '1.0.1' as Version)).toBe(-1)
  expect(versionCompare('1.0' as Version, '1.0' as Version)).toBe(0)
  expect(versionCompare('1.0.2' as Version, '1.0' as Version)).toBe(1)

  expect(latestVersion([] as Version[])).toBe(null)
  expect(latestVersion(['1.0'] as Version[])).toBe('1.0')
  expect(latestVersion(['1.0', '2.0'] as Version[])).toBe('2.0')
  expect(latestVersion(['1.0', '3.0', '2.0'] as Version[])).toBe('3.0')
})
