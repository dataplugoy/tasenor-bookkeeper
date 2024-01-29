/// <reference types="../support/index.d.ts" />

describe('Initialize user', () => {
  it('Create new user', () => {

    cy.fixture('ci.json').then((config) => {
      cy.adminLogin()
      cy.goto('Admin', 'Users', 'create-user')
      cy.form({
        'Full Name': config.USER,
        Password: config.PASSWORD,
        'Password Again': config.PASSWORD,
        Email: config.EMAIL,
      })
      cy.button('Submit').click()
      cy.messages().should('contain.text', 'User created successfully.')
    })
  })
})
