import '../support/commands'

describe.skip('Create databases', () => {
  it('Basic database for default user', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.language('fi')

      cy.goto('Tools', 'Databases')
      cy.icon('new-database').click()
      cy.dialog('Create New Database').text('Company Name').type(config.TEST_COMPANY)
      cy.dialog('Create New Database').text('Database Name').type('{selectall}').type(config.TEST_DATABASE)
      cy.selection('Accounting Scheme', 'FinnishLimitedCompanyComplete')
      cy.selection('Currency', 'EUR')
      cy.button('OK').click()

      cy.get('.Page').should('contain', 'Tilikaudet')
      cy.icon('create-period').click()
      cy.text('Start Date').type(`{selectall}1.1.${config.YEAR}`)
      cy.text('End Date').type(`{selectall}31.12.${config.YEAR}`)
      cy.button('OK').click()

      cy.get('table').should('cellEquals', 1, 1, `01.01.${config.YEAR}`)
      cy.get('table').should('cellEquals', 1, 2, `31.12.${config.YEAR}`)

      cy.language('en')
    })
  })
})
