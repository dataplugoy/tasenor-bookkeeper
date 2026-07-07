import '../support/commands'

describe('Bundled plugins', () => {
  it('Common plugins are bundled and available', { defaultCommandTimeout: 120_000 }, () => {

    cy.adminLogin()
    cy.goto('Admin', 'Plugins')
    cy.waitLoading()

    // Plugins are a permanent part of the application. They are always available on the
    // admin plugin listing without any install step.
    const common = [
      'CoinAPI',
      'CoinbaseImport',
      'DocumentCleaner',
      'Euro',
      'Finnish',
      'FinnishBalanceSheetReport',
      'FinnishIncomeStatementReport',
      'FinnishLimitedCompanyComplete',
      'IncomeAndExpenses',
      'JournalReport',
      'LedgerReport',
      'RapidAPI',
      'VAT',
      'VATFinland'
    ]
    common.forEach(code => cy.plugin(code).should('exist'))

    if (Cypress.expose('MODE') === 'nightly') {
      const nightly = [
        'GitBackup',
        'KrakenImport',
        'LynxImport',
        'NordeaImport',
        'NordnetImport',
        'Rand',
        'TagEditor',
        'TITOImport',
        'USDollar'
      ]
      nightly.forEach(code => cy.plugin(code).should('exist'))
    }
  })
})
