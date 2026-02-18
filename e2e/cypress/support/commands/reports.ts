/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
/// <reference types="cypress-xpath" />
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

/**
 * Navigate to reports and select a report by its identifier.
 */
Cypress.Commands.add('selectReport', (report: string) => {
  cy.menu('Reports').click()
  cy.get('.ReportsPage').should('exist')
  cy.get(`#SelectReport\\ ${report}`).click()
  cy.get(`.EndOfReport.${report}`).should('exist')
})

/**
 * Select a report option (e.g. quarter or full year).
 */
Cypress.Commands.add('selectReportOption', (option: string) => {
  cy.get(`#${option}`).click()
  cy.get('[class*="EndOfReport"]').should('exist')
})

/**
 * Toggle a report option on or off (e.g. byTags).
 */
Cypress.Commands.add('toggleReportOption', (option: string) => {
  cy.get(`#${option}`).click()
  cy.get('[class*="EndOfReport"]').should('exist')
})

/**
 * Verify that a report line contains the given title and value.
 */
Cypress.Commands.add('reportLine', (title: string, value: string) => {
  cy.xpath(`//*[contains(@class, "ReportDisplay")]//tr[contains(@class, "ReportLine")][.//*[text()="${title}"]][.//*[text()="${value}"]]`).should('exist')
})
