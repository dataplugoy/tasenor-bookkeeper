import { expect, test } from '@jest/globals'
import { near, num, realPositive, realNegative, strRound } from '../src'

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
  expect(strRound(9999)).toBe('9999')
  expect(strRound(19999)).toBe('19999')
  expect(strRound(-29999)).toBe('-29999')
})

test('messy number parsing', () => {
  expect(num('  12,300.50')).toBe(12300.50)
  expect(num('12.300,50')).toBe(12300.50)
  expect(num('12,5')).toBe(12.5)
  expect(num('12.5')).toBe(12.5)
  expect(num('$1,234,567')).toBe(1234567)
  expect(num('1.234.567')).toBe(1234567)
  expect(num('-1 234 567,89 €')).toBe(-1234567.89)
})
