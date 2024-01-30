import '../support/commands'

describe('Create databases', () => {
  it('Basic database for default user', () => {

    cy.userLogin()
    cy.goto('Tools', 'Databases')
    cy.language('fi')
    // cy.icon('new-database').click()
  })
})
