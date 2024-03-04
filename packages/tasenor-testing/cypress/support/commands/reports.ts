/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
/// <reference types=".." />

export {}

/**
 * Gather the report data from the table on the screen.
 */
Cypress.Commands.add('report', (): Cypress.Chainable<string[][]> => {
  return cy.box('Report').then(table => {
    const rows = table.find('tr')
    const report: string[][] = []
    rows.each(function(row) {
      const columns = Cypress.$(this).find('td')
      const texts: string[] = []
      columns.each(function(col) {
        let str = ''
        if (this.children.length) {
          Cypress.$(this.children).each(function() {
            const piece = Cypress.$(this).text()
            if (piece !== '') {
              if (str !== '') {
                str += ' '
              }
              str += piece
            }
          })
        } else {
          str = Cypress.$(this).text()
        }
        texts.push(str)
      })
      report.push(texts)
    })

    return report
  })
})
