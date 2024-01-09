import { expect, test } from '@jest/globals'
import { near, realPositive, realNegative, strRound } from '../src'

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

test('string rounding', () => {
  expect(strRound(0.01)).toBe('0.01')
  expect(strRound(-5)).toBe('-5')
  expect(strRound(0.00999)).toBe('0.00999')
  expect(strRound(0.009999)).toBe('0.01')
  expect(strRound(-2.08999999)).toBe('-2.09')
  expect(strRound(119.999999)).toBe('120')
})
