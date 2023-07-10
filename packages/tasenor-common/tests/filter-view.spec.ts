import { filterView2rule, filterView2name, filterView2results } from '../src'

test('Filter view to rule conversions', async () => {

  expect(filterView2rule({
    op: 'caseInsensitiveFullMatch',
    field: 'x',
    text: 'Simple'
  })).toBe('(lower(x) === "simple")')

  expect(filterView2rule({
    op: 'caseInsensitiveFullMatch',
    field: 'x',
    text: '"A"'
  })).toBe('(lower(x) === "\\"a\\"")')

  expect(filterView2rule({
    op: 'caseInsensitiveFullMatch',
    field: 'A&B',
    text: 'Simple'
  })).toBe('(lower($("A&B")) === "simple")')

  expect(filterView2rule({
    op: 'caseSensitiveFullMatch',
    field: 'x',
    text: 'Simple'
  })).toBe('(x === "Simple")')

  expect(filterView2rule({
    op: 'caseSensitiveFullMatch',
    field: 'x',
    text: '"A"'
  })).toBe('(x === "\\"A\\"")')

  expect(filterView2rule({
    op: 'caseSensitiveFullMatch',
    field: 'A&B',
    text: 'Simple'
  })).toBe('($("A&B") === "Simple")')

  expect(filterView2rule({
    op: 'caseInsensitiveMatch',
    field: 'x',
    text: 'Simple'
  })).toBe('contains(lower(x), "simple")')

  expect(filterView2rule({
    op: 'caseSensitiveMatch',
    field: 'x',
    text: 'Simple'
  })).toBe('contains(x, "Simple")')

  expect(filterView2rule({
    op: 'isLessThan',
    field: 'num',
    value: 0
  })).toBe('(num < 0)')

  expect(filterView2rule({
    op: 'isGreaterThan',
    field: 'num',
    value: 0
  })).toBe('(num > 0)')

  expect(filterView2rule([{
    op: 'caseInsensitiveFullMatch',
    field: 'y2',
    text: 'Simple'
  }, {
    op: 'isGreaterThan',
    field: 'num',
    value: 0
  }])).toBe('(lower(y2) === "simple") && (num > 0)')

  expect(filterView2rule({
    op: 'copyField',
    value: 'xyz'
  })).toBe('xyz')

  expect(filterView2rule({
    op: 'copyField',
    value: 'a/b'
  })).toBe('$("a/b")')

  expect(filterView2rule({
    op: 'copyInverseField',
    value: 'xyz'
  })).toBe('(-xyz)')

  expect(filterView2rule({
    op: 'copyInverseField',
    value: 'A Ä'
  })).toBe('(-$("A Ä"))')

  expect(filterView2rule({
    op: 'setLiteral',
    value: 1
  })).toBe('1')

  expect(filterView2rule({
    op: 'setLiteral',
    value: 1.234
  })).toBe('1.234')

  expect(filterView2rule({
    op: 'setLiteral',
    value: 'abc'
  })).toBe('"abc"')
})

test('Filter view to result conversion', async () => {
  expect(filterView2results([
    {
      reason: {
        op: 'setLiteral',
        value: 'expense'
      },
      type: {
        op: 'setLiteral',
        value: 'account'
      },
      asset: {
        op: 'setLiteral',
        value: '6677'
      },
      amount: {
        op: 'copyField',
        value: 'amount'
      },
      data: {
        text: {
          op: 'copyField',
          value: 'additionalinfo'
        }
      }
    }
  ])).toStrictEqual([
    {
      amount: 'amount',
      asset: '"6677"',
      data: {
        text: 'additionalinfo'
      },
      reason: '"expense"',
      type: '"account"'
    }
  ])
})

test('Filter view to name conversion', async () => {

  expect(filterView2name({
    op: 'caseInsensitiveMatch',
    field: 'x',
    text: 'Simple'
  })).toBe("x in lower case contains 'simple'")

  expect(filterView2name({
    op: 'caseInsensitiveMatch',
    field: 'x',
    text: '"A"'
  })).toBe("x in lower case contains '\"a\"'")

  expect(filterView2name({
    op: 'caseInsensitiveMatch',
    field: 'A&B',
    text: 'Simple'
  })).toBe("A&B in lower case contains 'simple'")

  expect(filterView2name({
    op: 'isLessThan',
    field: 'num',
    value: 0
  })).toBe('num is less than 0')

  expect(filterView2name({
    op: 'isGreaterThan',
    field: 'num',
    value: 0
  })).toBe('num is greater than 0')

  expect(filterView2name([{
    op: 'caseInsensitiveMatch',
    field: 'y2',
    text: 'Simple'
  }, {
    op: 'isGreaterThan',
    field: 'num',
    value: 0
  }])).toBe("y2 in lower case contains 'simple' and num is greater than 0")

  expect(filterView2name({
    op: 'copyField',
    field: 'xyz'
  })).toBe("copy 'xyz'")

  expect(filterView2name({
    op: 'copyField',
    field: 'a/b'
  })).toBe("copy 'a/b'")

  expect(filterView2name({
    op: 'copyInverseField',
    field: 'xyz'
  })).toBe("copy 'xyz' negated")

  expect(filterView2name({
    op: 'copyInverseField',
    field: 'A Ä'
  })).toBe("copy 'A Ä' negated")

  expect(filterView2name({
    op: 'setLiteral',
    value: 1
  })).toBe('set 1')

  expect(filterView2name({
    op: 'setLiteral',
    value: 1.234
  })).toBe('set 1.234')

  expect(filterView2name({
    op: 'setLiteral',
    value: 'abc'
  })).toBe('set "abc"')
})
