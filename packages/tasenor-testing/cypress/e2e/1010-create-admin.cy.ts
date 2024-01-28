/// <reference types="../support/index.d.ts" />

describe('Initialize admin', () => {
  it('Create admin user, if not yet done', () => {
    cy.visit('/')
    cy.fixture('ci.json').then((config) => {
      cy.request(Cypress.env('API_URL') + '/status').then(res => {
        if (!res.body.hasAdminUser) {

          cy.get('[name="full-name"]').type(config.ADMIN_USER)
          cy.get('[name="email"]').type(config.ADMIN_USER)
          cy.get('[name="password"]').type(config.ADMIN_PASSWORD)
          cy.get('[name="password-again"]').type(config.ADMIN_PASSWORD)
          cy.get('#submit').click()

          cy.get('.Page').should('contain', 'Admin Tools')

          cy.get('#LogoutMenu').click()

        } else {

          cy.get('[name="username"]').type(config.ADMIN_USER)
          cy.get('[name="password"]').type(config.ADMIN_PASSWORD)
          cy.get('#login').click()

          cy.get('.Page').should('contain', 'Admin Tools')

          cy.get('#LogoutMenu').click()

        }
      })
    })
  })
})
