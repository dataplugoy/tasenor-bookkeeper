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

  function login() {
    console.log('RUN LOGIN')
    cy.get('[name="username"]').type(email)
    cy.get('[name="password"]').type(password)
    cy.get('#login').click()

    if (admin) {
      cy.get('.Page').should('contain', 'Admin Tools')
    } else {
      cy.get('.Page').should('contain', 'Databases')
    }
  }

  cy.visit('/')
  login()
  /*
  cy.get('.current-user').then($user => {
    console.log($user.attr('cy-data'))
    cy.wrap($user[0]).invoke('attr', 'cy-data').then($email => {
      console.log($email)
    })
    if ($menu.find('.login-email').length) {
      cy.wrap($menu.find('.login-email')[0]).invoke('attr', 'cy-data').then($email => {
        console.log('FOUND', $email)
        if ($email === email) {
          console.log('MATCH')
          return
        } else {
          login()
        }
      })
    } else {
      login()
    }
  })
    */
})

Cypress.Commands.add('logout', () => {
  cy.get('#LogoutMenu').click()
})

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
