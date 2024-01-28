/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//

export {}

Cypress.Commands.add('login', (email: string, password: string, admin: boolean = false) => {
  cy.visit('/')
  cy.get('[name="username"]').type(email)
  cy.get('[name="password"]').type(password)
  cy.get('#login').click()

  if (admin) {
    cy.get('.Page').should('contain', 'Admin Tools')
  } else {
    cy.get('.Page').should('contain', 'Databases')
  }
})

Cypress.Commands.add('logout', () => {
  cy.get('#LogoutMenu').click()
})

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string, admin?: boolean): Chainable<void>
      logout(): Chainable<void>
    }
  }
}
