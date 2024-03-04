import '../support/commands'
import 'cypress-xpath'
import 'cypress-real-events'

describe('Insert transactions', () => {
  it('Create normal transactions', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.language('fi')
      cy.selectDb(config.TEST_DATABASE)
      cy.icon('add-tx').click()
      // TODO: Should test also using keyboard without clicking.
      cy.accountSelector('Select Account').click()
      cy.get('[data-cy="Account 1900"]').click()
      cy.button('OK').click()
      cy.fill2PartIncomeTx(`12.3.${config.YEAR}`, 'Deposit of the company capital', '2500', '2001')
      cy.icon('add-tx').click()
      cy.fill2PartIncomeTx(`13.3.${config.YEAR}`, 'Loan from Business Bank', '7500,0', '2621')
      cy.icon('add-tx').click()
      cy.fill2PartIncomeTx(`13.3.${config.YEAR}`, 'Loan from Investment Bank', '6000,000', '2622')
      cy.balance('1900').should('equal', 16_000)
      cy.balance('2001').should('equal', -2500)
      cy.balance('2621').should('equal', -7500)
      cy.balance('2622').should('equal', -6000)
    })
  })

  it('Create VAT transactions', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.language('fi')
      cy.selectDb(config.TEST_DATABASE)

      cy.selectBalance('1900')
      cy.icon('add-tx').click()
      cy.fill3PartExpenseTx(`16.3.${config.YEAR}`, 'Buy computer', '300', '7680')
      cy.icon('add-tx').click()
      cy.fill3PartExpenseTx(`16.3.${config.YEAR}`, 'Buy mouse', '10', '7680')
      cy.icon('add-tx').click()
      cy.fill3PartIncomeTx(`16.3.${config.YEAR}`, 'Sell 1h consultation', '100', '3000')
      cy.icon('add-tx').click()
      cy.fill3PartIncomeTx(`16.3.${config.YEAR}`, 'Sell 2h consultation', '200', '3010')
      cy.balance('1900').should('equal', 15990.00)
      cy.balance('2001').should('equal', -2500.00)
      cy.balance('2621').should('equal', -7500.00)
      cy.balance('2622').should('equal', -6000.00)
      cy.balance('29391').should('equal', -58.06)
      cy.balance('29392').should('equal', 60.00)
      cy.balance('7680').should('equal', 250.00)
      cy.balance('3000').should('equal', -80.65)
      cy.balance('3010').should('equal', -161.29)

      cy.language('en')
    })
  })
})
