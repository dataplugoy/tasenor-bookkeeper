import { filter2function } from '../src'

test('Filtering: no rule', async () => {
  expect(filter2function<unknown>(null)(null)).toBeTruthy()
  expect(filter2function<unknown>(null)(undefined)).toBeTruthy()
  expect(filter2function<unknown>(null)({ a: '' })).toBeTruthy()
  expect(filter2function<unknown>(null)({ a: 3 })).toBeTruthy()

  expect(filter2function<unknown>(undefined)(null)).toBeTruthy()
  expect(filter2function<unknown>(undefined)(undefined)).toBeTruthy()
  expect(filter2function<unknown>(undefined)({ a: '' })).toBeTruthy()
  expect(filter2function<unknown>(undefined)({ a: 3 })).toBeTruthy()
})

test('Filtering: EqualityRuleShortcut', async () => {
  expect(filter2function({ a: 2 })({ a: 3 })).toBeFalsy()
  expect(filter2function({ a: 2 })({ a: 2 })).toBeTruthy()
  expect(filter2function({ a: 2 })({ a: 2, b: 1 })).toBeTruthy()
  expect(filter2function({ a: 2, b: 1 })({ a: 2 })).toBeFalsy()
  expect(filter2function({ a: 2, b: 1 })({ a: 2, b: 1 })).toBeTruthy()
  expect(filter2function({ a: 'a' })({ a: 2, b: 1 })).toBeFalsy()
  expect(filter2function({ a: 'a' })({ a: 'a', b: 1 })).toBeTruthy()
  expect(filter2function({ a: [1, 2] })({ a: 2, b: 1 })).toBeTruthy()
  expect(filter2function({ a: [1, 2] })({ a: 3, b: 1 })).toBeFalsy()
  expect(filter2function({ a: [] })({ a: 1 })).toBeFalsy()
})
