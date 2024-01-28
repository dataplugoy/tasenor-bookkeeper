/// <reference types="../support/index.d.ts" />

describe('Initialize admin', () => {
  it('Create admin user, if not yet done', () => {
    cy.fixture('ci.json').then((config) => {
      cy.visit('/')
      cy.request(Cypress.env('API_URL') + '/status').then(res => {
        if (!res.body.hasAdminUser) {

          cy.get('[name="full-name"]').type(config.ADMIN_USER)
          cy.get('[name="email"]').type(config.ADMIN_USER)
          cy.get('[name="password"]').type(config.ADMIN_PASSWORD)
          cy.get('[name="password-again"]').type(config.ADMIN_PASSWORD)
          cy.get('#submit').click()

          cy.get('.Page').should('contain', 'Admin Tools')

          cy.logout()

        } else {

          cy.login(config.ADMIN_USER, config.ADMIN_PASSWORD, true)
          cy.logout()

        }
      })
    })
  })
})
