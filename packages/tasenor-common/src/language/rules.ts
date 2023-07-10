import Opaque from 'ts-opaque'
import { create, all, factory, MathJsStatic, clone, typed } from 'mathjs'
import { AssetTransfer, isCurrency, warning } from '..'
import { num } from '../utils'
import { TextFileLine } from '../import/TextFileLine'
import { UIQuery } from './query'
import { note } from '../logging'
import { RuleFilterView, RuleResultView } from './editor'

export type Expression = Opaque<string, 'Expression'>

export type RuleValue = number | string | null | false | true | object | Array<RuleValue>
export type RuleVariables = Record<string, RuleValue>
export type ImportRuleResult = Record<Partial<keyof AssetTransfer>, Expression>
export type ImportRuleOptions = Partial<{
  singleMatch: boolean
}>
export type ImportRule = {
  name: string
  filter: Expression
  comment?: string
  options?: ImportRuleOptions
  view?: {
    filter: RuleFilterView[]
    result: RuleResultView[]
  },
  questions?: Record<string, UIQuery<string>>
  result: ImportRuleResult | ImportRuleResult[]
  examples?: TextFileLine[]
}

/**
 * Failure to parse a rule.
 */
export class RuleParsingError extends Error {

  expression: Expression
  variables: RuleVariables

  constructor(msg: string, expression: Expression, variables: RuleVariables) {
    super(msg)
    this.expression = expression
    this.variables = clone(variables)
  }
}

/**
 * ## Rules Evaluation Engine
 *
 * The core of the rules engine is based on the [MathJS](https://mathjs.org/docs/expressions/syntax.html).
 *
 * ### Variables
 *
 * Typically a collection of variables are defined for the processing. For example in importing CSV file
 * we have all columns defined as variables. Note that the parser accept wide range of characters to be
 * used in the variable name. Those which cannot be expressed directly, we can use syntax like
 *
 *   `$('Variable with space')`
 *
 * ### Relations
 *
 * In addition to the standard relations, the engine defines comparisons and concatenation for strings.
 *
 * ### Custom Functions
 *
 * These functions are specifically defined for the rules engine:
 *
 * * `$` - {@link RulesEngine.$}
 * * `capitalize` - {@link RulesEngine.capitalize}
 * * `cents` - {@link RulesEngine.cents}
 * * `chosen` - {@link RulesEngine.chosen}
 * * `clean` - {@link RulesEngine.clean}
 * * `contains` - {@link RulesEngine.contains}
 * * `concat` - {@link RulesEngine.concat}
 * * `d` - {@link RulesEngine.d}
 * * `has` - {@link RulesEngine.has}
 * * `isCurrency` - {@link RulesEngine.isCurrency}
 * * `join` - {@link RulesEngine.join}
 * * `lower` - {@link RulesEngine.lower}
 * * `num` - {@link RulesEngine.num}
 * * `par` - {@link RulesEngine.par}
 * * `str` - {@link RulesEngine.str}
 * * `rates` - {@link RulesEngine.rates}
 * * `regex` - {@link RulesEngine.regex}
 * * `sum` - {@link RulesEngine.sum}
 * * `times` - {@link RulesEngine.times}
 * * `ucfirst` - {@link RulesEngine.ucfirst}
 *
 */
export class RulesEngine {

  private engine: MathJsStatic
  private scope: Record<string, RuleValue | CallableFunction>
  private variables: RuleVariables
  private quiet: boolean

  constructor(variables?: RuleVariables, quiet = false) {
    this.quiet = quiet
    this.engine = create({
      ...all,
      // String relations.
      createEqual: factory('equal', [], () => typed('equal', {
        // If we need more combinations, we can add them here.
        'string, string': function equal(a, b) {
          return a === b
        }
      })
      ),
      createUnequal: factory('unequal', [], () => typed('unequal', {
        'string, string': function equal(a, b) {
          return a !== b
        }
      })
      ),
      createSmaller: factory('smaller', [], () => typed('smaller', {
        'string, string': function equal(a, b) {
          return a < b
        }
      })
      ),
      createSmallerEq: factory('smallerEq', [], () => typed('smallerEq', {
        'string, string': function equal(a, b) {
          return a <= b
        }
      })
      ),
      createLarger: factory('larger', [], () => typed('larger', {
        'string, string': function equal(a, b) {
          return a > b
        }
      })
      ),
      createLargerEq: factory('largerEq', [], () => typed('largerEq', {
        'string, string': function equal(a, b) {
          return a >= b
        }
      })
      ),
      createCompare: factory('compare', [], () => typed('compare', {
        'string, string': function equal(a, b) {
          return a > b ? 1 : a < b ? -1 : 0
        }
      })
      ),
      // Some other ops.
      createAdd: factory('add', [], () => typed('add', {
        'number, number': function equal(a, b) {
          return a + b
        },
        'string, string': function equal(a, b) {
          return `${a}${b}`
        }
      })
      )
    }, {
      // Configuration here.
    })

    this.scope = {
      $: (column: string, defaultValue: RuleValue | undefined = undefined) => this.$(column, defaultValue),
      capitalize: (s: string) => this.capitalize(s),
      cents: (n: number) => this.cents(n),
      chosen: (question: string) => this.chosen(question),
      clean: (s: string) => this.clean(s),
      concat: (vector: unknown[], field: string | undefined, sep: string | undefined) => this.concat(vector, field, sep),
      contains: (s: string, r: string) => this.contains(s, r),
      d: (...args: unknown[]) => this.d(...args),
      has: (list: unknown[], str: unknown) => this.has(list, str),
      isCurrency: (str: string) => this.isCurrency(str),
      join: (...args: unknown[]) => this.join(...args),
      lower: (s: string) => this.lower(s),
      num: (column: string) => this.num(column),
      par: (...exprs: RuleValue[]) => this.par(...exprs),
      rates: (...args) => this.rates(args),
      regex: (re: string, compare: string, flags: string | undefined) => this.regex(re, compare, flags),
      str: (column: unknown) => this.str(column),
      sum: (vector: unknown[], field: string | undefined) => this.sum(vector, field),
      times: (count: unknown, target: unknown) => this.times(count, target),
      ucfirst: (s: string) => this.ucfirst(s),

      // Disable dangerous functions.
      import: function () { throw new Error('Function import is disabled.') },
      createUnit: function () { throw new Error('Function createUnit is disabled.') },
      evaluate: function () { throw new Error('Function evaluate is disabled.') },
      parse: function () { throw new Error('Function parse is disabled.') },
      simplify: function () { throw new Error('Function simplify is disabled.') },
      derivative: function () { throw new Error('Function derivative is disabled.') }
    }

    this.variables = variables || {}
  }

  /**
   * Evaluate a string expression or object with multiple expressions.
   * @param expr
   * @param variables
   * @returns
   */
  eval(expr: Expression | string | object, variables?: RuleVariables): RuleValue {
    if (variables) {
      this.variables = clone(variables)
    }
    if (expr instanceof Object) {
      if (expr === null) {
        return null
      }
      if (expr instanceof Array) {
        return expr.map(e => this.eval(e))
      }
      const result: Record<string, RuleValue> = {}
      Object.keys(expr).forEach(k => (result[k] = this.eval(expr[k])))
      return result
    }
    let result
    try {
      result = this.engine.evaluate(expr, { ...this.scope, ...this.variables })
      // Convert matrix back to javascript.
      if (result && typeof result === 'object' && result._data && result._size) {
        return result._data
      }
    } catch (err) {
      throw new RuleParsingError(err.message, expr as Expression, variables || {})
    }
    return result
  }

  /**
   * Access function for columns having spaces or other special characters in their name.
   * Also safe way to get variable that does not necessarily exist, when default value is provided.
   *
   * **Example**
   *
   * ```typescript
   * $('Column Name', null)
   * ```
   * @param column
   * @returns
   */
  $(column: string, defaultValue: RuleValue | undefined = undefined): RuleValue | undefined {
    return column in this.variables ? this.variables[column] : defaultValue
  }

  /**
   * Use heuristic approach to convert string with spaces and possibly delimters to number.
   *
   * **Example**
   *
   * ```typescript
   * num("  12,300.50") // => 12300.50
   * ```
   * @param column
   * @returns
   */
  num(str: string | number): RuleValue | typeof NaN {
    if (typeof (str) === 'number') {
      return str
    }
    const ret = num(`${str}`)
    if (!this.quiet && isNaN(ret)) {
      warning(`Unable to parse number from ${JSON.stringify(str)}.`)
    }
    return ret
  }

  /**
   * Check if the string represents currency.
   *
   * **Example**
   *
   * ```typescript
   * isCurrency("EUR") // => true
   * ```
   * @param str
   * @returns
   */
  isCurrency(str: string): boolean {
    return isCurrency(str)
  }

  /**
   * Test if a list has a member.
   */
  has(list: unknown[], item: unknown): boolean {
    for (const e of list) {
      if (item === (e as { value: unknown, index: number }).value) return true
    }
    return false
  }

  /**
   * Construct rate object for one or more rate.
   *
   * **Example**
   *
   * ```typescript
   * rates("USD", 0.88, "GBP", 1.19) => { "USD": 0.88, "GBP": 1.19 }
   * ```
   * @param args [asset, rate, asset2, rate2,...]
   */
  rates(args: unknown[]): Record<string, RuleValue> {
    const ret: Record<string, RuleValue> = {}
    for (let i = 0; i < args.length; i += 2) {
      ret[`${args[i]}`] = this.num(args[i + 1] as string | number)
    }
    return ret
  }

  /**
   * Test a string against regular expression.
   *
   * **Example**
   *
   * ```typescript
   * regex("[0-9]+", "Foo 123 Bar") // => true
   * regex("([0-9]+)", "Foo 123 Bar") // => ["123"]
   * ```
   * @param re
   * @param compare
   * @returns Either true or false or match groups, if given in the regular expression.
   */
  regex(re: string, compare: string, flags: string | undefined = undefined): boolean | string[] {
    const regex = flags ? new RegExp(re, flags) : new RegExp(re)
    const match = regex.exec(compare)

    if (!match) return false

    const groups: string[] = []
    for (let i = 1; match[i] !== undefined; i++) {
      groups.push(match[i])
    }

    return groups.length ? groups : true
  }

  /**
   * Check each argument and trim the white space. If anything left, construct a string starting with a space
   * and after that all non-empty parts as comma separated list. If there are no non-empty arguments, return
   * empty string. Also null and false values are dropped.
   *
   * **Example**
   *
   * ```typescript
   * par("  ", "abc", null, "def  ") // => " abc, def"
   * par(false, "   ") // => ""
   * ```
   * @param exprs
   */
  par(...exprs: RuleValue[]): string {
    const nonEmpty = exprs.filter(e => e !== null && e !== false).map(e => `${e}`.trim()).filter(e => e !== '')
    return nonEmpty.length ? ` (${nonEmpty.join(', ')})` : ''
  }

  /**
   * Check the existence of the variable and return it. If not defined, throw an error.
   * @param variable
   */
  var(variable: string): unknown {
    if (!(variable in this.variables)) {
      throw new Error(`A variable '${variable}' is not defined.`)
    }
    return this.variables[variable]
  }

  /**
   * Look for actual text of the answer option selected when resolved a variable in the current rule.
   *
   * **Example**
   *
   * @param string
   *
   * If more than one match is found, they are returned comma separated.
   */
  chosen(questionVar: string): string {
    const ans = this.var(questionVar)
    const rule: ImportRule = this.var('rule') as ImportRule
    const questions: Record<string, UIQuery> = rule.questions as Record<string, UIQuery>
    if (!(questionVar in questions)) {
      throw new Error(`Cannot find variable '${questionVar}' from questions of the rule ${JSON.stringify(rule.questions)}'.`)
    }
    const question = questions[questionVar]
    if ('ask' in question) {
      const matches = Object.entries(question.ask).filter(([, v]) => v === ans).map(([k]) => k)
      if (matches.length) {
        return matches.join(', ')
      }
      throw new Error(`Unable to find any matches for answer ${JSON.stringify(ans)} from question ${JSON.stringify(question)}.`)
    }
    throw new Error(`Cannot reverse map question ${JSON.stringify(question)}, when looking for chosen '${questionVar}'.`)
  }

  /**
   * Check if the first string contains the second string.
   * @param s
   * @param r
   * @returns
   */
  contains(s: string, r: string): boolean {
    return s.indexOf(r) >= 0
  }

  /**
   * Convert first letter to upper case.
   *
   * **Example**
   *
   * ```typescript
   * ucfirst("foo bar") // "Foo bar"
   * ```
   * @param s
   */
  ucfirst(s: string): string {
    return s.substring(0, 1).toUpperCase() + s.substring(1)
  }

  /**
   * Convert string to lower case.
   *
   * **Example**
   *
   * ```typescript
   * lower("ABC") // => "abc"
   * ```
   * @param s
   */
  lower(s: string): string {
    return s.toLowerCase()
  }

  /**
   * Capitalize all words.
   *
   * **Example**
   *
   * ```typescript
   * capitalize('no small caps') // => "No Small Caps"
   * ```
   * @param s
   */
  capitalize(s: string): string {
    return s.toLowerCase().split(' ').map(s => this.ucfirst(s)).join(' ')
  }

  /**
   * Convert number to cents, i.e. 1/100th, rounding off extra decimals.
   *
   * **Example**
   *
   * ```typescript
   * cents(3.141592) // => 314
   * ```
   * @param n
   * @returns 100 x n as integer.
   */
  cents(n: number): number {
    if (typeof n !== 'number') {
      throw new Error(`Invalid argument ${JSON.stringify(n)} for cents().`)
    }
    return Math.round(n * 100)
  }

  /**
   * Force conversion of the argument to string.
   * @param x
   * **Example**
   *
   * ```typescript
   * str(undefined) // => "undefined"
   * ```
   */
  str(x: unknown): string {
    return `${x}`
  }

  /**
   * Join non-empty trimmed argments as a space separated string.
   * @param args
   * **Example**
   *
   * ```typescript
   * join(undefined, 12, null, '  kg') // => "12 kg"
   * ```
   */
  join(...args: unknown[]) {
    return args.filter(a => a !== undefined && a !== null).map(a => `${a}`.trim()).filter(a => a !== '').join(' ')
  }

  /**
   * Print the arguments to the debug log and return the value of the last argument.
   * @param args
   * @returns
   */
  d(...args: unknown[]) {
    note('[DEBUG]', ...args)
    return args.length ? args[args.length - 1] : undefined
  }

  /**
   * Convert numeric multiplier to text.
   * @param count
   * @param target
   * If count is not given, the value is empty string.
   * Otherwise if it is greater than zero the strint `<count> x <targer>` is returned.
   */
  times(count: unknown, target: unknown): string {
    if (count === undefined || count === null || count === 0) {
      return ''
    }
    const num = parseInt(`${count}`)
    return `${num} x ${target}`
  }

  /**
   * Calculate sum of the vector of numbers or member fields of vector of objects.
   * @param vector
   * @param field
   * This function is resilient with non-numeric values and they are silently ignored.
   */
  sum(vector: unknown[], field: string | undefined): number {
    if (typeof vector !== 'object') {
      throw new Error(`Invalid argument ${JSON.stringify(vector)} for sum().`)
    }

    let total = 0

    if (!field) {
      vector.forEach(function (value) {
        if (value) {
          try {
            const add = parseInt(value as string)
            if (!isNaN(add)) {
              total += add
            }
          } catch (err) {}
        }
      })
    } else {
      vector.forEach(function (value: Record<string, unknown>) {
        if (value[field]) {
          try {
            const add = parseInt(value[field] as string)
            if (!isNaN(add)) {
              total += add
            }
          } catch (err) {}
        }
      })
    }

    return total
  }

  /**
   * Concatenate non-empty strings in the vector or member fields of vector of objects.
   * @param vector
   * @param field
   * @param sep
   *
   * Only entries with proper values are used. Empty strings, nulls etc are ignored.
   * If separator is not given, new line is used by default.
   */
  concat(vector: unknown[], field: string | undefined, sep: string | undefined) {
    if (typeof vector !== 'object') {
      throw new Error(`Invalid argument ${JSON.stringify(vector)} for concat().`)
    }

    const parts: string[] = []

    if (!field) {
      vector.forEach(function (value) {
        if (value) {
          parts.push(`${value}`)
        }
      })
    } else {
      vector.forEach(function (value: Record<string, unknown>) {
        if (value[field]) {
          parts.push(`${value[field]}`)
        }
      })
    }

    return parts.join(sep || '\n')
  }

  /**
   * General purpose cleaning. Trim spaces from the beginning and end of each line. Reduce multiple spaces to one.
   * Keep newlines as they are except empty lines are dropped.
   *
   * **Example**
   *
   * ```typescript
   * clean("   A    \n       B    C") // => "A\nB C"
   * ```
   * @param s
   */
  clean(s: string): string {
    return s.split('\n')
      .map(s => s.replace(/\s+/g, ' ').replace(/^\s+/, '').replace(/\s+$/, ''))
      .filter(s => s !== '')
      .join('\n')
  }
}
