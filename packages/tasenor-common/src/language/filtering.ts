import { Value } from '../types/common'

/**
 * This rule is an object of form `{ k_1: v_1, ..., k_N: v_N }` which is interpreted as "All fields `k_i` must have value `v_i`"
 */
export type EqualityRuleShortcut = {
  [key: string]: Value
}

/**
 * All valid filtering rules.
 */
export type FilterRule = null | undefined | EqualityRuleShortcut

/**
 * Definition of the filttering function type.
 */
export type FilterFunction<TargetType=Record<string, unknown> > = (arg: TargetType) => boolean

/**
 * Convert a filterin rule to the funciton executing the rule on the target entity.
 * @param rule A filtering rule.
 * @returns
 */
export function filter2function<TargetType=Record<string, unknown> >(rule: FilterRule): FilterFunction<TargetType> {
  // No rules.
  if (rule === null || rule === undefined) {
    return () => true
  }

  // Function to verify that the argument is valid for comparison.
  const isValid =(arg: TargetType) => typeof arg === 'object' || arg !== null

  // Helper to create function for matching.
  const makeRule = (k, v): FilterFunction<TargetType> => {
    const t = typeof v
    if (t === 'number' || t === 'string') {
      return (arg: TargetType) => arg[k] === v
    }
    if (t === 'object' && v instanceof Array) {
      const s = new Set(v)
      return (arg: TargetType) => s.has(arg[k])
    }
    throw new Error(`No interpretation of value ${JSON.stringify(v)} in filtering rule ${JSON.stringify(rule)}.`)
  }

  // Compose a rule from objects.
  if (typeof rule === 'object') {

    const testers: FilterFunction<TargetType>[] = []
    Object.entries(rule).map(([k, v]) => {
      testers.push(makeRule(k, v))
    })

    return (arg: TargetType) => {

      if (!isValid(arg)) return false

      for (let i = 0; i < testers.length; i++) {
        if (!testers[i](arg)) {
          return false
        }
      }
      return true
    }
  }

  throw new Error(`Syntax error in filtering rule ${JSON.stringify(rule)}`)
}
