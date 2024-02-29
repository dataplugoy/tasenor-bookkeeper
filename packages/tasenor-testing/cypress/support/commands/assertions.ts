/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
export {}

/**
 * Find a table row and cell and check if text content is the defined.
 */
chai.Assertion.addChainableMethod('cellEquals', function(row: number, col: number, text: string) {
  const cell = this._obj.find('tr').eq(row).find('td').eq(col)
  expect(cell.text()).to.eq(text)
})
