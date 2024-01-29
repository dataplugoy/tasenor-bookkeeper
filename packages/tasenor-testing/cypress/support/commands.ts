/// <reference types="cypress" />

export {}

/**
 * Log in, if not yet logged in as `email`. If `admin` set, expect us to land on admin page.
 */
Cypress.Commands.add('login', (email: string, password: string, admin: boolean = false) => {

  cy.visit('/')
  cy.get('.current-user').then($user => {
    if ($user.attr('cy-data') !== email) {
      cy.get('[name="username"]').type(email)
      cy.get('[name="password"]').type(password)
      cy.get('#login').click()

      if (admin) {
        cy.get('.Page').should('contain', 'Admin Tools')
      } else {
        cy.get('.Page').should('contain', 'Databases')
      }
    }
  })
})

/**
 * Log out.
 */
Cypress.Commands.add('logout', () => {
  cy.get('#LogoutMenu').click()
})

/**
 * Log in as admin.
 */
Cypress.Commands.add('adminLogin', () => {
  cy.fixture('ci.json').then((config) => {
    cy.login(config.ADMIN_USER, config.ADMIN_PASSWORD, true)
  })
})

declare global {
  namespace Cypress {
    interface Chainable {
      adminLogin(): Chainable<void>
      login(email: string, password: string, admin?: boolean): Chainable<void>
      logout(): Chainable<void>
    }
  }
}
