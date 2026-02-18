import '../support/commands'
import 'cypress-xpath'

describe('Remove databases', () => {
  before(() => {
    // Ensure the test database exists (may have been deleted by a previous run).
    cy.fixture('ci.json').then((config) => {
      const apiUrl = Cypress.env('API_URL')
      cy.request('POST', `${apiUrl}/auth`, {
        user: config.USER,
        password: config.PASSWORD
      }).then((authRes) => {
        const token = authRes.body.token
        cy.request({
          url: `${apiUrl}/db`,
          headers: { Authorization: `Bearer ${token}` }
        }).then((dbsRes) => {
          const exists = dbsRes.body.some((db: { name: string }) => db.name === config.TEST_DATABASE)
          if (!exists) {
            cy.request({
              method: 'POST',
              url: `${apiUrl}/db`,
              headers: { Authorization: `Bearer ${token}` },
              body: {
                scheme: 'FinnishLimitedCompanyComplete',
                databaseName: config.TEST_DATABASE,
                companyName: config.TEST_COMPANY,
                companyCode: '',
                settings: { language: 'fi', currency: 'EUR' }
              }
            })
          }
        })
      })
    })
  })

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
      cy.get('[name="deleted-database-name"]').type(`${config.TEST_DATABASE}FAIL`)
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
      cy.get('[name="deleted-database-name"]').type(config.TEST_DATABASE)
      cy.get('#OK').click()

      // Verify database card is removed
      cy.xpath(`//*[contains(@class, "Database") and contains(@class, "MuiCardHeader")]//*[text()='${config.TEST_DATABASE}']`)
        .should('not.exist')

      cy.shouldHaveInfo('Database deleted permanently.')
    })
  })
})
