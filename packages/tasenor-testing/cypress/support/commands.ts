/// <reference types="cypress" />

import './commands/elements'

export {}

declare global {
  namespace Cypress {
    interface Chainable {
      adminLogin(): Chainable<void>
      goto(menu: string, listItem: string, icon: string | null): Chainable<void>
      login(email: string, password: string, admin?: boolean): Chainable<void>
      logout(): Chainable<void>
      menu(text: string): Chainable<JQuery<HTMLElement>>
      list(text: string): Chainable<JQuery<HTMLElement>>
      icon(text: string): Chainable<JQuery<HTMLElement>>
      button(text: string): Chainable<JQuery<HTMLElement>>
      text(text: string): Chainable<JQuery<HTMLElement>>
      form(fields: Record<string, string>): Chainable<void>
    }
  }
}

/**
 * Log in, if not yet logged in as `email`. If `admin` set, expect us to land on admin page.
 */
Cypress.Commands.add('login', (email: string, password: string, admin = false) => {

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
 * Select menu and optionally a side menu.
 */
Cypress.Commands.add('goto', (menu: string, listItem: string, icon: string | null = null) => {
  cy.menu(menu).click()
  cy.list(listItem).click()
  if (icon) {
    cy.icon(icon).click()
  }
})
