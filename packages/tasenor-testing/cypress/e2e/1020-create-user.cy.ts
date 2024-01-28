/// <reference types="../support/index.d.ts" />

describe('Initialize user', () => {
  it('Create new user', () => {
    cy.fixture('ci.json').then((config) => {
      cy.login(config.ADMIN_USER, config.ADMIN_PASSWORD, true)
    })
  })
})
