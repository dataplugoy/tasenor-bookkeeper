import '../support/commands'

describe('Install plugins', () => {
  it('Add common plugins', () => {

    cy.adminLogin()
    cy.goto('Admin', 'Plugins')

    cy.installPlugin('CoinAPI')
    cy.installPlugin('CoinbaseImport')
    cy.installPlugin('DocumentCleaner')
    cy.installPlugin('Euro')
    cy.installPlugin('Finnish')
    cy.installPlugin('FinnishBalanceSheetReport')
    cy.installPlugin('FinnishIncomeStatementReport')
    cy.installPlugin('FinnishLimitedCompanyComplete')
    cy.installPlugin('IncomeAndExpenses')
    cy.installPlugin('JournalReport')
    cy.installPlugin('LedgerReport')
    cy.installPlugin('RapidAPI')
    cy.installPlugin('VAT')
    cy.installPlugin('VATFinland')

    if (Cypress.env('MODE') === 'nightly') {
      cy.installPlugin('GitBackup')
      cy.installPlugin('KrakenImport')
      cy.installPlugin('LynxImport')
      cy.installPlugin('NordeaImport')
      cy.installPlugin('NordnetImport')
      cy.installPlugin('Rand')
      cy.installPlugin('RapidAPI')
      cy.installPlugin('TagEditor')
      cy.installPlugin('TITOImport')
      cy.installPlugin('USDollar')
    }
  })
})
