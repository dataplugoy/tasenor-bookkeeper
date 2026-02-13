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

    cy.plugin('Finnish').should('contain.text', 'Unsubscribe')
    cy.plugin('DocumentCleaner').should('contain.text', 'Unsubscribe')
    cy.plugin('JournalReport').should('contain.text', 'Unsubscribe')
    cy.plugin('LedgerReport').should('contain.text', 'Unsubscribe')
    cy.plugin('FinnishBalanceSheetReport').should('contain.text', 'Unsubscribe')
    cy.plugin('FinnishIncomeStatementReport').should('contain.text', 'Unsubscribe')
    cy.plugin('FinnishLimitedCompanyComplete').should('contain.text', 'Unsubscribe')
    cy.plugin('VAT').should('contain.text', 'Unsubscribe')
    cy.plugin('Euro').should('contain.text', 'Unsubscribe')
    cy.plugin('IncomeAndExpenses').should('contain.text', 'Unsubscribe')
    cy.plugin('VATFinland').should('contain.text', 'Unsubscribe')
    cy.plugin('CoinAPI').should('contain.text', 'Subscribe')
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

    cy.plugin('CoinAPI').should('contain.text', 'Unsubscribe')
    cy.plugin('DocumentCleaner').should('contain.text', 'Unsubscribe')
    cy.plugin('Euro').should('contain.text', 'Unsubscribe')
    cy.plugin('Finnish').should('contain.text', 'Unsubscribe')
    cy.plugin('FinnishBalanceSheetReport').should('contain.text', 'Unsubscribe')
    cy.plugin('FinnishIncomeStatementReport').should('contain.text', 'Unsubscribe')
    cy.plugin('FinnishLimitedCompanyComplete').should('contain.text', 'Unsubscribe')
    cy.plugin('IncomeAndExpenses').should('contain.text', 'Unsubscribe')
    cy.plugin('JournalReport').should('contain.text', 'Unsubscribe')
    cy.plugin('LedgerReport').should('contain.text', 'Unsubscribe')
    cy.plugin('VAT').should('contain.text', 'Unsubscribe')
    cy.plugin('VATFinland').should('contain.text', 'Unsubscribe')
  })
})
