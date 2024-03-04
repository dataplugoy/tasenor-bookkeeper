/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
export {}

/**
 * Log in, if not yet logged in as `email`. If `admin` set, expect us to land on admin page.
 */
Cypress.Commands.add('login', (email: string, password: string, admin = undefined) => {

  cy.visit('/')
  cy.get('.current-user').then($user => {
    if ($user.attr('data-cy') !== email) {
      if ($user.attr('data-cy')) {
        cy.logout()
      }

      cy.text('Email').type(email)
      cy.text('Password').type(password)
      cy.button('Login').click()

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
  cy.menu('Logout').click()
})

/**
 * Log in as admin.
 */
Cypress.Commands.add('adminLogin', () => {
  cy.fixture('ci.json').then((config) => {
    cy.login(config.ADMIN_USER, config.ADMIN_PASSWORD, true)
  })
})

/**
 * Log in as normal user.
 */
Cypress.Commands.add('userLogin', () => {
  cy.fixture('ci.json').then((config) => {
    cy.login(config.USER, config.PASSWORD)
  })
})

/**
 * Log in as QA user.
 */
Cypress.Commands.add('qaLogin', () => {
  cy.fixture('ci.json').then((config) => {
    cy.login(config.QA_USER, config.QA_PASSWORD)
  })
})
