import '../support/commands'

describe('Subscribe plugins', () => {
  it('Subscribe for test user', () => {

    cy.userLogin()

    cy.goto('Shop')
    cy.subscribePlugin('Finnish')
    cy.subscribePlugin('DocumentCleaner')
    cy.subscribePlugin('JournalReport')
    cy.subscribePlugin('LedgerReport')
    cy.subscribePlugin('FinnishBalanceSheetReport')
    cy.subscribePlugin('FinnishIncomeStatementReport')
    cy.subscribePlugin('FinnishLimitedCompanyComplete')
    cy.subscribePlugin('VAT')
    cy.subscribePlugin('Euro')
    cy.subscribePlugin('IncomeAndExpenses')
    cy.subscribePlugin('VATFinland')

    cy.subscribePlugin('CoinAPI')
    cy.unsubscribePlugin('CoinAPI')
  })

  it('Subscribe for QA user', () => {

    cy.qaLogin()

    cy.goto('Shop')
    cy.subscribePlugin('CoinAPI')
    cy.subscribePlugin('DocumentCleaner')
    cy.subscribePlugin('Euro')
    cy.subscribePlugin('Finnish')
    cy.subscribePlugin('FinnishBalanceSheetReport')
    cy.subscribePlugin('FinnishIncomeStatementReport')
    cy.subscribePlugin('FinnishLimitedCompanyComplete')
    cy.subscribePlugin('IncomeAndExpenses')
    cy.subscribePlugin('JournalReport')
    cy.subscribePlugin('LedgerReport')
    cy.subscribePlugin('VAT')
    cy.subscribePlugin('VATFinland')
  })
})
