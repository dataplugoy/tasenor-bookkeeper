/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
/// <reference types="cypress-xpath" />
/// <reference types=".." />

export {}

/**
 * Select a period by its from and to dates.
 */
Cypress.Commands.add('selectPeriod', (from: string, to: string) => {
  cy.get(`#period-${from}-${to} button`).click()
  cy.get('.BalanceTable').should('exist')
})

/**
 * Lock a period by clicking the lock icon.
 */
Cypress.Commands.add('lockPeriod', (period: string) => {
  cy.xpath(`//tr[@id="Period ${period}"]//*[@title="Lock period"]`).click()
})

/**
 * Create a new period by clicking the tool icon and confirming.
 */
Cypress.Commands.add('createPeriod', () => {
  cy.clickToolIcon('Create Period')
  cy.get('#OK').click()
})
