import { expect, test } from '@jest/globals'
import { RulesEngine, RuleParsingError } from '../src'

test('Rules: constants', () => {
  const e = new RulesEngine()

  expect(e.eval('""')).toBe('')
  expect(e.eval("''")).toBe('')
  expect(e.eval('"a"')).toBe('a')
  expect(e.eval('3.0')).toBe(3)
  expect(e.eval('null')).toBe(null)
  expect(e.eval('false')).toBe(false)
  expect(e.eval('true')).toBe(true)
  expect(e.eval('undefined')).toBe(undefined)
  expect(e.eval('NaN')).toBe(NaN)
})

test('Rules: variables', () => {
  const e = new RulesEngine({
    a: 1,
    λ: 2,
    Tämä: 3,
    'Long Name': 4
  })

  expect(e.eval('a')).toBe(1)
  expect(e.eval('λ')).toBe(2)
  expect(e.eval('Tämä')).toBe(3)
  expect(e.eval('$("a")')).toBe(1)
  expect(e.eval('$("Long Name")')).toBe(4)
  expect(e.eval('$("no such thing")')).toBe(undefined)
})

test('Rules: objects', () => {
  const e = new RulesEngine({
    a: {
      b: {
        c: 1
      }
    }
  })

  expect(e.eval('a')).toStrictEqual({ b: { c: 1 } })
  expect(e.eval('a.b')).toStrictEqual({ c: 1 })
  expect(e.eval('a.b.c')).toBe(1)
  expect(e.eval('null')).toBe(null)
  expect(e.eval('[1, 2, 3]')).toStrictEqual([1, 2, 3])
  expect(e.eval('[1, 2, 3]')).toStrictEqual([1, 2, 3])
})

test('Rules: deep eval', () => {
  const e = new RulesEngine()
  expect(e.eval(['1', '2', '3'])).toStrictEqual([1, 2, 3])
  expect(e.eval({ a: '"x"' })).toStrictEqual({ a: 'x' })
})

test('Rules: basic math', () => {
  const e = new RulesEngine()

  expect(e.eval('1 - 2')).toBe(-1)
  expect(e.eval('1 / 2')).toBe(0.5)
  expect(e.eval('5 * 6')).toBe(30)
  expect(e.eval('---1 + 1')).toBe(0)
  expect(e.eval('(2 + 2)*2')).toBe(8)
})

test('Rules: comparison', () => {
  const e = new RulesEngine({ one: 1 })

  expect(e.eval('1 < 2')).toBe(true)
  expect(e.eval('one > 2')).toBe(false)
  expect(e.eval('5 == 6')).toBe(false)
  expect(e.eval('true and 2')).toBe(true)
  expect(e.eval('one != 1 or false')).toBe(false)
  expect(e.eval('not 1')).toBe(false)
})

test('Rules: strings', () => {
  const e = new RulesEngine()
  expect(e.eval("'a' == 'b'")).toBe(false)
  expect(e.eval("'a' == 'a'")).toBe(true)
  expect(e.eval("'a' < 'a'")).toBe(false)
  expect(e.eval("'a' <= 'a'")).toBe(true)
  expect(e.eval("'a' > 'a'")).toBe(false)
  expect(e.eval("'a' >= 'a'")).toBe(true)
  expect(e.eval("'a' >= 'a'")).toBe(true)
  expect(e.eval("'a' + 'b'")).toBe('ab')
})

test('Rules: arrays', () => {
  const e = new RulesEngine()
  expect(e.eval('[]')).toStrictEqual([])
  expect(e.eval('[1, 2]')).toStrictEqual([1, 2])
  expect(e.eval('[[1, 2], [3, 4]]')).toStrictEqual([[1, 2], [3, 4]])
})

test('Rules: exceptions', () => {
  const e = new RulesEngine({}, true)
  expect(() => e.eval('a+')).toThrow(RuleParsingError)
  expect(() => e.eval('--')).toThrow(RuleParsingError)
  expect(() => e.eval('notDefined')).toThrow(RuleParsingError)
})

test('Rules: num()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval("num('1 000')")).toBe(1000)
  expect(e.eval("num('1 000 000.00')")).toBe(1000000)
  expect(e.eval("num('0,5')")).toBe(0.5)
  expect(e.eval("num('0.5')")).toBe(0.5)
  expect(e.eval("num('1,000.5')")).toBe(1000.5)
  expect(e.eval("num('1.000,5')")).toBe(1000.5)
})

test('Rules: isCurrency()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval("isCurrency('EUR')")).toBe(true)
  expect(e.eval("isCurrency('USD')")).toBe(true)
  expect(e.eval("isCurrency('SEK')")).toBe(true)
  expect(e.eval("isCurrency('DKK')")).toBe(true)
  expect(e.eval("isCurrency('XYZ')")).toBe(false)
  expect(e.eval("isCurrency('')")).toBe(false)
})

test('Rules: rates()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval("rates('a', '1,2', 'b', '0.11')")).toStrictEqual({ a: 1.2, b: 0.11 })
})

test('Rules: regex()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval("regex('[abc]', 'Buffa')")).toBe(true)
  expect(e.eval("regex('([abc]+)', 'Buffa')")).toStrictEqual(['a'])
  expect(e.eval("regex('x', 'Buffa')")).toBe(false)
  expect(e.eval("regex('.*', 'Buffa')")).toBe(true)
  expect(e.eval("regex('(.)(.*)', 'Buffa')")).toStrictEqual(['B', 'uffa'])
  expect(e.eval("regex('buf', 'Buffa')")).toBe(false)
  expect(e.eval("regex('buf', 'Buffa', 'i')")).toBe(true)
  expect(e.eval("regex('\\\\b84\\\\b', '1-84-1')")).toBe(true)
  expect(e.eval("regex('\\\\b84\\\\b', '1841')")).toBe(false)
})

test('Rules: par()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval("par('a')")).toBe(' (a)')
  expect(e.eval("par('a', '  b', '  ', '  c')")).toBe(' (a, b, c)')
  expect(e.eval("par('  ', '')")).toBe('')
  expect(e.eval("par('  ', 1, null, false, '  ')")).toBe(' (1)')
  expect(e.eval('par(0)')).toBe(' (0)')
})

test('Rules: chosen()', () => {
  const e = new RulesEngine({
    foo: 1,
    rule: {
      questions: {
        foo: {
          ask: {
            a: 1,
            b: 2,
            c: 3,
            d: 2
          }
        }
      }
    }
  }, true)
  expect(e.eval("chosen('foo')")).toBe('a')

  const e2 = new RulesEngine({
    foo: 2,
    rule: {
      questions: {
        foo: {
          ask: {
            a: 1,
            b: 2,
            c: 3,
            d: 2
          }
        }
      }
    }
  }, true)
  expect(e2.eval("chosen('foo')")).toBe('b, d')
})

test('Rules: ucfirst()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval("ucfirst('')")).toBe('')
  expect(e.eval("ucfirst('abc')")).toBe('Abc')
  expect(e.eval("ucfirst('ABC')")).toBe('ABC')
})

test('Rules: capitalize()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval("capitalize('')")).toBe('')
  expect(e.eval("capitalize('abc def')")).toBe('Abc Def')
  expect(e.eval("capitalize('ABC DEF')")).toBe('Abc Def')
})

test('Rules: capitalize()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval('cents(0)')).toBe(0)
  expect(e.eval('cents(100.001)')).toBe(10000)
  expect(e.eval('cents(100.005)')).toBe(10001)
  expect(e.eval('cents(-1)')).toBe(-100)
  expect(e.eval('cents(-1.005)')).toBe(-100)
  expect(e.eval('cents(-1.0051)')).toBe(-101)
  expect(e.eval('cents(0.000632) > 0')).toBe(false)
})

test('Rules: str()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval('str(0)')).toBe('0')
  expect(e.eval('str(undefined)')).toBe('undefined')
  expect(e.eval('str(null)')).toBe('null')
  expect(e.eval("str('')")).toBe('')
  expect(e.eval('str(1 < 2)')).toBe('true')
  expect(e.eval('str(1 > 2)')).toBe('false')
})

test('Rules: join()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval('join(0)')).toBe('0')
  expect(e.eval("join(undefined, 1, null, 'x')")).toBe('1 x')
  expect(e.eval("join(' a ', ' b ')")).toBe('a b')
})

test('Rules: sum()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval('sum([])')).toBe(0)
  expect(e.eval('sum([1,2,3])')).toBe(6)
  expect(e.eval("sum([1,null,'',3, 'xx'])")).toBe(4)
  expect(e.eval("sum([{a: 3}, {b: -4}, {a: 1, b: 5}], 'a')")).toBe(4)
  expect(e.eval("sum([{a: 3}, {b: -4}, {a: 1, b: 5}], 'b')")).toBe(1)
  expect(e.eval("sum([{a: 3}, {b: -4}, {a: 1, b: 5}], 'c')")).toBe(0)
  expect(e.eval("sum([], 'c')")).toBe(0)
})

test('Rules: collect()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval('collect([])')).toBe('')
  expect(e.eval("collect(['a', null, 'b', undefined, ''])")).toBe('a\nb')
  expect(e.eval("collect(['a', null, 'b', undefined, ''], null, '+')")).toBe('a+b')
  expect(e.eval("collect([{a: 3}, {b: -4}, {a: 1, b: 5}], 'a')")).toBe('3\n1')
  expect(e.eval("collect([{a: 3}, {b: -4}, {a: 1, b: 5}], 'x')")).toBe('')
})

test('Rules: clean()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval("clean('   A    V')")).toBe('A V')
  expect(e.eval("clean('')")).toBe('')
  expect(e.eval("clean('     ')")).toBe('')
  expect(e.eval("clean('   A    V')")).toBe('A V')
})

test('Rules: ? :', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval('1 ? 200 : 300')).toBe(200)
  expect(e.eval('0 ? 200 : 300')).toBe(300)
})

test('Rules: has()', () => {
  const e = new RulesEngine({}, true)
  expect(e.eval("has([1, null, 'x'], 1)")).toBe(true)
  expect(e.eval("has([1, null, 'x'], null)")).toBe(true)
  expect(e.eval("has([1, null, 'x'], 'x')")).toBe(true)
  expect(e.eval('has([], 1)')).toBe(false)
  expect(e.eval('has([], null)')).toBe(false)
  expect(e.eval("has([], 'x')")).toBe(false)
  expect(e.eval("has([0, '', false], 1)")).toBe(false)
  expect(e.eval("has([0, '', false], null)")).toBe(false)
  expect(e.eval("has([0, '', false], 'x')")).toBe(false)
})
