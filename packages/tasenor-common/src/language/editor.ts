import { Expression } from "./rules"

/**
 * The mode for rule editor is using currently for editing components.
 */
export type RuleColumnEditMode = null | 'textMatch'

/**
 * Matching mode to display in rule filter rule visualization.
 *
 * Each matching mode defines how the visual presentation is formed for the rule.
 */
export type RuleViewOp = 'caseInsensitiveMatch' |
  'caseSensitiveMatch' |
  'caseInsensitiveFullMatch' |
  'caseSensitiveFullMatch' |
  'isLessThan' |
  'isGreaterThan' |
  'setLiteral' |
  'copyInverseField' |
  'copyField'

export function isRuleViewOp(obj): obj is RuleViewOp {
  return obj === 'caseInsensitiveMatch' ||
  obj === 'caseSensitiveMatch' ||
  obj === 'caseInsensitiveFullMatch' ||
  obj === 'caseSensitiveFullMatch' ||
  obj === 'isLessThan' ||
  obj === 'isGreaterThan' ||
  obj === 'setLiteral' ||
  obj === 'copyInverseField' ||
  obj === 'copyField'
}

/**
 * Description how the filter expression has been constructed for visual presentation.
 */
export type RuleFilterView = {
  op: RuleViewOp
  field?: string
  text?: string
  value?: number | string
}

/**
 * Descriptiion how the result expression has been constructed for visual presentation.
 */
export type RuleResultView = {
  reason: {
    op: RuleViewOp,
    field?: string,
    value?: string
  },
  type: {
    op: RuleViewOp,
    field?: string,
    value?: string
  },
  asset: {
    op: RuleViewOp,
    field?: string,
    value?: string
  },
  amount: {
    op: RuleViewOp,
    field?: string,
    value?: string
  },
  tags?: {
    op: RuleViewOp,
    field?: string,
    value?: string
  },
  data?: {
    text: {
      op: RuleViewOp,
      field?: string,
      value?: string
    }
  }
}

export type RuleView = {
  filter: RuleFilterView[]
  result: RuleResultView[]
}

/**
 * Convert a `RuleFilterView` description to the rule expression.
 * @param view
 * @returns
 */
export function filterView2rule(view: RuleFilterView | RuleFilterView[]): Expression {
  if (view instanceof Array) {
    return view.map(v => filterView2rule(v)).join(' && ') as Expression
  }
  const { op, field, text, value } = view
  const variable = field === undefined ? '' : (/^[a-zA-Z]\w*$/.test(field) ? field : '$(' + JSON.stringify(field) + ')')

  switch (op) {
    case 'setLiteral':
      return JSON.stringify(value) as Expression
    case 'copyInverseField':
      const val = value === undefined ? '' : (/^[a-zA-Z]\w*$/.test(`${value}`) ? `${value}` : '$(' + JSON.stringify(value) + ')')
      return `(-${val})` as Expression
    case 'copyField':
      const val2 = value === undefined ? '' : (/^[a-zA-Z]\w*$/.test(`${value}`) ? `${value}` : '$(' + JSON.stringify(value) + ')')
      return `${val2}` as Expression
    case 'caseInsensitiveFullMatch':
      return `(lower(${variable}) === ${JSON.stringify(text?.toLowerCase())})` as Expression
    case 'caseSensitiveFullMatch':
      return `(${variable} === ${JSON.stringify(text)})` as Expression
    case 'caseInsensitiveMatch':
      return `contains(lower(${variable}), ${JSON.stringify(text?.toLowerCase())})` as Expression
    case 'caseSensitiveMatch':
      return `contains(${variable}, ${JSON.stringify(text)})` as Expression
    case 'isLessThan':
      return `(${variable} < ${JSON.stringify(value)})` as Expression
    case 'isGreaterThan':
      return `(${variable} > ${JSON.stringify(value)})` as Expression
    default:
      throw new Error(`A filterView2rule with operation '${op}' is not implemented.`)
  }
}

/**
 * Convert a `RuleFilterView` description to the rule name proposal.
 * @param view
 * @returns
 */
 export function filterView2name(view: RuleFilterView | RuleFilterView[]): string {
  if (view instanceof Array) {
    return view.map(v => filterView2name(v)).join(' and ')
  }
  const { op, field, text, value } = view

  switch (op) {
    case 'setLiteral':
      return `set ${JSON.stringify(value)}`
    case 'copyInverseField':
      return `copy '${field}' negated`
    case 'copyField':
      return `copy '${field}'`
    case 'caseInsensitiveFullMatch':
      return `${field} in lower case is '${text?.toLowerCase()}'`
    case 'caseSensitiveFullMatch':
      return `${field} is '${text}'`
    case 'caseSensitiveMatch':
      return `${field} contains '${text}'`
    case 'caseInsensitiveMatch':
      return `${field} in lower case contains '${text?.toLowerCase()}'`
    case 'isLessThan':
      return `${field} is less than ${value}`
    case 'isGreaterThan':
      return `${field} is greater than ${value}`
    default:
      throw new Error(`A filterView2name with operation '${op}' is not implemented.`)
  }
}

/**
 * Convert result view to actual rule expressions.
 * @param view
 * @returns
 */
export function filterView2results(view: RuleResultView | RuleResultView[]) {
  if (view instanceof Array) {
    return view.map(v => filterView2results(v))
  }

  const ret: object = {}

  Object.entries(view).map(([k, v]) => {
    if (typeof v === 'object' && v !== null) {
      if ('op' in v && isRuleViewOp(v['op'])) {
        ret[k] = filterView2rule(v)
      } else {
        ret[k] = filterView2results(v as unknown as RuleResultView)
      }
    }
  })

  return ret
}
