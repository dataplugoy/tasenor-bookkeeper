import { expect, test } from '@jest/globals'
import { near, realPositive, realNegative } from '../src'

test('near', () => {
  expect(near(0, 0)).toBeTruthy()
  expect(near(-1000, -1000.0000001)).toBeTruthy()
  expect(near(-1000, -1001)).toBeFalsy()
})

test('realPositive', () => {
  expect(realPositive(0.01)).toBeTruthy()
  expect(realPositive(0)).toBeFalsy()
  expect(realPositive(0.0000001)).toBeFalsy()
  expect(realPositive(-0.0000001)).toBeFalsy()
  expect(realPositive(-0.01)).toBeFalsy()
})

test('realNegative', () => {
  expect(realNegative(-0.01)).toBeTruthy()
  expect(realNegative(0)).toBeFalsy()
  expect(realNegative(0.0000001)).toBeFalsy()
  expect(realNegative(-0.0000001)).toBeFalsy()
  expect(realNegative(0.01)).toBeFalsy()
})
