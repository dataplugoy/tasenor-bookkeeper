import '../support/commands'

describe('Initialize user', () => {
  // TODO: User exists. Needed only once this test is moved to replace robot tests.
  it.skip('Create QA user', () => {

    cy.fixture('ci.json').then((config) => {
      cy.adminLogin()
      cy.goto('Admin', 'Users', 'create-user')
      cy.form({
        'Full Name': 'QA',
        Password: config.QA_PASSWORD,
        'Password Again': config.QA_PASSWORD,
        Email: config.QA_USER,
      })
      cy.button('Submit').click()
      cy.messages().should('contain.text', 'User created successfully.')
    })
  })
})
