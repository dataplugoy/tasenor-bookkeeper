/// <reference types="../support/index.d.ts" />

describe('Initialize admin', () => {
  it('Create admin user, if not yet done', () => {
    cy.visit('/')
    cy.get('.MainArea').then($page => {
       if ($page.html().includes('Please register an admin user')) {

       } else {
        // Verify login.
       }
    })
  })
})
