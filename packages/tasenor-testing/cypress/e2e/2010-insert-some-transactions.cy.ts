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
      // TODO: Test also using keyboard.
      cy.accountSelector('Select Account').click()
      cy.get(`[data-cy="Account 1900"]`).click()
      cy.button('OK').click()
      cy.fill2PartIncomeTx(`12.3.${config.YEAR}`, 'Deposit of the company capital', '2500', '2001')
      cy.icon('add-tx').click()
      cy.fill2PartIncomeTx(`13.3.${config.YEAR}`, 'Loan from Business Bank', '7500,0', '2621')
      cy.icon('add-tx').click()
      cy.fill2PartIncomeTx(`13.3.${config.YEAR}`, 'Loan from Investment Bank', '6000,000', '2622')


      // cy.language('en')
    })
  })
})
