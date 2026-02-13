import '../support/commands'
import 'cypress-xpath'
import 'cypress-real-events'

const SELECTED_DATE = '//*[contains(@class, "TransactionDetails")][contains(@class, "date")][contains(@class, "sub-selected")]'
const SELECTED_ACCOUNT = '//*[contains(@class, "TransactionDetails")][contains(@class, "account")][contains(@class, "sub-selected")]'
const SELECTED_DESCRIPTION = '//*[contains(@class, "TransactionDetails")][contains(@class, "description")][contains(@class, "sub-selected")]'
const SELECTED_DEBIT = '//*[contains(@class, "TransactionDetails")][contains(@class, "debit")][contains(@class, "sub-selected")]'
const SELECTED_CREDIT = '//*[contains(@class, "TransactionDetails")][contains(@class, "credit")][contains(@class, "sub-selected")]'

describe('Transaction editing', () => {
  it('Test bad date format and proposal', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.language('en')

      // Select next year period
      cy.goto('⌂')
      cy.list(config.TEST_DATABASE).click()
      cy.selectPeriod(`${config.NEXT_YEAR}-01-01`, `${config.NEXT_YEAR}-12-31`)
      cy.selectBalance('1900')

      // Start new transaction
      cy.realPress(['Control', 'a'])

      // Localization format not right
      cy.xpath(SELECTED_DATE).should('exist')
      cy.editTransactionCell(`7.6.${config.NEXT_YEAR}`)
      cy.shouldHaveError('Date is incorrect.')

      // Year is not right
      cy.clearTransactionCell()
      cy.realType(`${config.YEAR}-06-07`)
      cy.realPress('Enter')
      cy.shouldHaveError('Date is before the current period starts.')

      // Get it right
      cy.clearTransactionCell()
      cy.realType(`${config.NEXT_YEAR}-03-31`)
      cy.realPress('Enter')
      cy.xpath(SELECTED_ACCOUNT).should('exist')

      // Fill transaction with proposal
      cy.realPress('ArrowRight')
      cy.xpath(SELECTED_DESCRIPTION).should('exist')
      cy.editTransactionCell('Bought even more stuff')
      cy.xpath(SELECTED_DEBIT).should('exist')
      cy.editTransactionCell('500')
      cy.xpath(SELECTED_CREDIT).should('exist')
      cy.realPress('Tab')
      cy.xpath(SELECTED_ACCOUNT).should('exist')
      cy.editTransactionCell('4000')
      cy.xpath(SELECTED_DESCRIPTION).should('exist')
      cy.realPress('ArrowRight')
      cy.realPress('ArrowRight')
      cy.xpath(SELECTED_CREDIT).should('exist')
      cy.realPress('Enter')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000)
      cy.get('.proposal').should('exist')
      cy.realPress('ArrowDown')
      cy.realPress('Enter')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000)

      // Check balances
      cy.accountBalanceShouldBe('4000', '-500,00€')
      cy.accountBalanceShouldBe('1900', '16 490,00€')
    })
  })

  it('Delete lines of transaction and whole transaction', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.language('en')

      // Select next year period
      cy.goto('⌂')
      cy.list(config.TEST_DATABASE).click()
      cy.selectPeriod(`${config.NEXT_YEAR}-01-01`, `${config.NEXT_YEAR}-12-31`)
      cy.selectBalance('1900')

      // Delete one line
      cy.selectNamedTx('Bought even more stuff')
      cy.realPress('ArrowDown')
      cy.realPress('ArrowDown')
      cy.waitUntilTxSelected('4000 Ostot')
      cy.realPress(['Control', 'x'])
      cy.contains('Delete').should('be.visible')
      cy.realPress('Enter')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000)

      // Verify balance still shows the tx amount (minus the deleted line)
      cy.accountBalanceShouldBe('1900', '16 490,00€')

      // Delete the remainder
      cy.realPress(['Control', 'x'])
      cy.contains('Delete').should('be.visible')
      cy.realPress('Enter')
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(1000)

      cy.accountBalanceShouldBe('1900', '15 990,00€')
    })
  })
})
