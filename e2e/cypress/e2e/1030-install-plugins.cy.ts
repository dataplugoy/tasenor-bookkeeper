import '../support/commands'

describe('Install plugins', () => {
  it('Add common plugins', { defaultCommandTimeout: 120_000 }, () => {

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

    // TODO: Could implement 'have.button' and use it here.
    cy.plugin('CoinAPI').should('contain.text', 'Remove')
    cy.plugin('CoinbaseImport').should('contain.text', 'Remove')
    cy.plugin('DocumentCleaner').should('contain.text', 'Remove')
    cy.plugin('Euro').should('contain.text', 'Remove')
    cy.plugin('Finnish').should('contain.text', 'Remove')
    cy.plugin('FinnishBalanceSheetReport').should('contain.text', 'Remove')
    cy.plugin('FinnishIncomeStatementReport').should('contain.text', 'Remove')
    cy.plugin('FinnishLimitedCompanyComplete').should('contain.text', 'Remove')
    cy.plugin('IncomeAndExpenses').should('contain.text', 'Remove')
    cy.plugin('JournalReport').should('contain.text', 'Remove')
    cy.plugin('LedgerReport').should('contain.text', 'Remove')
    cy.plugin('RapidAPI').should('contain.text', 'Remove')
    cy.plugin('VAT').should('contain.text', 'Remove')
    cy.plugin('VATFinland').should('contain.text', 'Remove')

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

      cy.plugin('GitBackup').should('contain.text', 'Remove')
      cy.plugin('KrakenImport').should('contain.text', 'Remove')
      cy.plugin('LynxImport').should('contain.text', 'Remove')
      cy.plugin('NordeaImport').should('contain.text', 'Remove')
      cy.plugin('NordnetImport').should('contain.text', 'Remove')
      cy.plugin('Rand').should('contain.text', 'Remove')
      cy.plugin('RapidAPI').should('contain.text', 'Remove')
      cy.plugin('TagEditor').should('contain.text', 'Remove')
      cy.plugin('TITOImport').should('contain.text', 'Remove')
      cy.plugin('USDollar').should('contain.text', 'Remove')
    }

    cy.icon('rebuild-plugins').click()
    cy.waitLoading()
  })
})
