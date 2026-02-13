/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
/// <reference types=".." />

export {}

/**
 * Create a new account from the accounts page.
 */
Cypress.Commands.add('createAccount', (number: string, name: string, type: string) => {
  cy.get('#CreateNewAccount').click()
  cy.get('[name="account_number"]').clear().type(number)
  cy.get('[name="account_name"]').type(name)
  cy.get('.account-type-dropdown').click()
  cy.get(`li[data-value="${type}"]`).should('be.visible').click()
  cy.get('#OK').should('be.enabled').click()
  cy.contains(`${number} ${name}`)
})

/**
 * Select an account from the account list.
 */
Cypress.Commands.add('selectAccountFromList', (number: string) => {
  cy.get(`#Account${number}`).should('be.visible').click()
})
