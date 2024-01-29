/// <reference types="../support/index.d.ts" />

describe('Initialize user', () => {
  it('Create new user', () => {
    cy.adminLogin()
    cy.goto('Admin', 'Users', 'create-user')
  })
})
