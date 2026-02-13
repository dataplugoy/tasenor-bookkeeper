import '../support/commands'
import 'cypress-xpath'

describe('Remove databases', () => {
  it('Try to remove database with wrong name', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.language('en')
      cy.visit('/')
      cy.gotoTools()

      // Click delete button for the test database
      cy.xpath(`//*[contains(@class, "Database") and contains(@class, "MuiCardHeader")]//*[text()='${config.TEST_DATABASE}']/../../..//*[contains(@class,'DeleteDatabase')]`)
        .click()

      // Enter wrong name
      cy.get('#deleted-database-name').type(`${config.TEST_DATABASE}FAIL`)
      cy.get('#OK').click()

      cy.shouldHaveError('Database name was not given correctly.')
    })
  })

  it('Actually remove database', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.language('en')
      cy.gotoTools()

      // Click delete button for the test database
      cy.xpath(`//*[contains(@class, "Database") and contains(@class, "MuiCardHeader")]//*[text()='${config.TEST_DATABASE}']/../../..//*[contains(@class,'DeleteDatabase')]`)
        .click()

      // Enter correct name
      cy.get('#deleted-database-name').type(config.TEST_DATABASE)
      cy.get('#OK').click()

      // Verify database card is removed
      cy.xpath(`//*[contains(@class, "Database") and contains(@class, "MuiCardHeader")]//*[text()='${config.TEST_DATABASE}']`)
        .should('not.exist')

      cy.shouldHaveInfo('Database deleted permanently.')
    })
  })
})
