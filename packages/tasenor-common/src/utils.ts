/**
 * Common utilities.
 */

import { ZERO_CENTS } from './constants'
import { isContainerElement, isNamedElement, TasenorElement } from './risp'

/**
 * Check if the current environment is a browser.
 * @returns Boolean.
 */
export function isUi(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Check if the current environment is Node.
 * @returns Boolean.
 */
export function isNode(): boolean {
  return !isUi()
}

/**
 * A promise to resolve after the given timeout.
 * @param msec Time in milliseconds.
 * @returns
 */
export async function waitPromise(msec: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, msec)
  })
}

/**
 * Capitalize a string.
 * @param text
 * @returns
 */
export function ucfirst(text: string): string {
  return text[0].toUpperCase() + text.substr(1)
}

/**
 * Check that numeric values are closer than ZERO_CENTS apart.
 * @param value1
 * @param value2
 */
export function near(value1: number, value2: number): boolean {
  return Math.abs(value1 - value2) < ZERO_CENTS
}

/**
 * Check that value is lesser than other within ZERO_CENTS margin.
 * @param value1
 * @param value2
 * @returns
 */
export function less(value1: number, value2: number): boolean {
  return value1 < value2 && !near(value2 - value1, 0)
}

/**
 * Check that value is belown zero more than ZERO_CENTS margin.
 * @param value1
 * @param value2
 * @returns
 */
export function realNegative(value: number): boolean {
  return less(value, 0)
}

/**
 * Check that value is belown zero more than ZERO_CENTS margin.
 * @param value1
 * @param value2
 * @returns
 */
export function realPositive(value: number): boolean {
  return less(0, value)
}

/**
  * Collect all names defined in the element structure.
  * @returns
  * All {@link ContainerElement | container elements} are scanned recursively and names of the {@link NamedElement | named elements}
  * are collected.
  */
export function elementNames(element: TasenorElement): Set<string> {
  if (isContainerElement(element)) {
    const vars = new Set<string>()
    for (const sub of element.elements) {
      for (const name of elementNames(sub)) {
        vars.add(name)
      }
    }
    return vars
  } else if (isNamedElement(element)) {
    return new Set([element.name])
  }
  return new Set()
}

/**
 * Utility to heuristically convert a messy string to number.
 * @returns
 * The string is stripped off extra spaces and all but last punctuation.
 */
export function num(str: string): number | typeof NaN {
  str = str.replace(/\s/g, '')
  try {
    if (/,\d+\./.test(str)) {
      str = str.replace(/,/g, '')
    } else if (/\.\d+,/.test(str)) {
      str = str.replace(/\./g, '').replace(/,/, '.')
    } else {
      str = str.replace(',', '.')
    }
    return parseFloat(str)
  } catch (err) {
    return NaN
  }
}

/**
 * Check if the name is related to some secret in need of removal from logs etc.
 */
export function needHiding(s: string): boolean {
  return /(password|api[-_]*key|secret)/i.test(s)
}

/**
 * Get intersection of two sets.
 */
export function setIntersect<T>(s1: Set<T>, s2: Set<T>): Set<T> {
  const tmp: T[] = [...s1].filter(x => s2.has(x))
  return new Set<T>(tmp)
}
