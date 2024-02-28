export {}

const SELECTED_DATE='//*[contains(@class, "TransactionDetails")][contains(@class, "date")][contains(@class, "sub-selected")]'
const SELECTED_ACCOUNT='//*[contains(@class, "TransactionDetails")][contains(@class, "account")][contains(@class, "sub-selected")]'
const SELECTED_DESCRIPTION='//*[contains(@class, "TransactionDetails")][contains(@class, "description")][contains(@class, "sub-selected")]'
const SELECTED_DEBIT='//*[contains(@class, "TransactionDetails")][contains(@class, "debit")][contains(@class, "sub-selected")]'
const SELECTED_CREDIT='//*[contains(@class, "TransactionDetails")][contains(@class, "credit")][contains(@class, "sub-selected")]'
const CURRENTLY_SELECTED_ROW='//tr[contains(@class, "Transaction")][contains(@class, "Mui-selected")]'

/**
 * Assume that we have freshly added transaction and date field active. Create new income transaction.
 */
Cypress.Commands.add('fill2PartIncomeTx', (date: string, text: string, amount: string, account: string) => {
  cy.xpath(SELECTED_DATE).should('exist')
  cy.realType(date)
  cy.realPress('Enter')
  cy.xpath(SELECTED_ACCOUNT).should('exist')
  cy.realPress('ArrowRight')
  cy.xpath(SELECTED_DESCRIPTION).should('exist')
  cy.realType(text)
  cy.realPress('Enter')
  cy.xpath(SELECTED_DEBIT).should('exist')
  cy.realType(amount)
  cy.realPress('Enter')
  cy.xpath(SELECTED_CREDIT).should('exist')
  cy.realPress('Tab')
  cy.xpath(SELECTED_ACCOUNT).should('exist')
  cy.realType(account)
  cy.realPress('Enter')
  cy.xpath(SELECTED_DESCRIPTION).should('exist')
  cy.realPress('Tab')
  cy.xpath(SELECTED_DEBIT).should('exist')
  cy.realPress('Tab')
  cy.xpath(SELECTED_CREDIT).should('exist')
  cy.realType(amount)
  cy.realPress('Enter')
  cy.xpath(SELECTED_CREDIT).should('exist')
  cy.realPress('Escape')
  cy.xpath(SELECTED_CREDIT).should('not.exist')
  cy.realPress('Escape')
  cy.realPress('Escape')
  cy.xpath(CURRENTLY_SELECTED_ROW).should('not.exist')
})

/**
 * Assume that we have freshly added transaction and date field active. Create new expense transaction with VAT.
 */
Cypress.Commands.add('fill3PartExpenseTx', (date: string, text: string, amount: string, account: string) => {
  cy.xpath(SELECTED_DATE).should('exist')
  cy.realType(date)
  cy.realPress('Enter')
  cy.xpath(SELECTED_ACCOUNT).should('exist')
  cy.realPress('ArrowRight')
  cy.xpath(SELECTED_DESCRIPTION).should('exist')
  cy.realType(text)
  cy.realPress('Enter')
  cy.xpath(SELECTED_DEBIT).should('exist')
  cy.realPress('ArrowRight')
  cy.xpath(SELECTED_CREDIT).should('exist')
  cy.realType(amount)
  cy.realPress('Enter')
  cy.xpath(SELECTED_CREDIT).should('exist')
  cy.realPress('Tab')
  cy.xpath(SELECTED_ACCOUNT).should('exist')
  cy.realType(account)
  cy.realPress('Enter')
  cy.xpath(SELECTED_DESCRIPTION).should('exist')
  cy.realPress('ArrowRight')
  cy.xpath(SELECTED_DEBIT).should('exist')
  cy.realType(amount)
  cy.realPress('Enter')
  cy.xpath(SELECTED_CREDIT).should('exist')
  cy.realPress('Escape')
  cy.xpath(SELECTED_CREDIT).should('not.exist')
  cy.realPress('Escape')
  cy.realPress('Escape')
  cy.xpath(CURRENTLY_SELECTED_ROW).should('not.exist')
})

/**
 * Assume that we have freshly added transaction and date field active. Create new income transaction with VAT.
 */
Cypress.Commands.add('fill3PartIncomeTx', (date: string, text: string, amount: string, account: string) => {
  cy.xpath(SELECTED_DATE).should('exist')
  cy.realType(date)
  cy.realPress('Enter')
  cy.xpath(SELECTED_ACCOUNT).should('exist')
  cy.realPress('ArrowRight')
  cy.xpath(SELECTED_DESCRIPTION).should('exist')
  cy.realType(text)
  cy.realPress('Enter')
  cy.xpath(SELECTED_DEBIT).should('exist')
  cy.realType(amount)
  cy.realPress('Enter')
  cy.xpath(SELECTED_CREDIT).should('exist')
  cy.realPress('Tab')
  cy.xpath(SELECTED_ACCOUNT).should('exist')
  cy.realType(account)
  cy.realPress('Enter')
  cy.xpath(SELECTED_DESCRIPTION).should('exist')
  cy.realPress('ArrowRight')
  cy.xpath(SELECTED_DEBIT).should('exist')
  cy.realPress('ArrowRight')
  cy.xpath(SELECTED_CREDIT).should('exist')
  cy.realType(amount)
  cy.realPress('Enter')
  cy.xpath(SELECTED_ACCOUNT).should('exist')
  cy.realPress('Escape')
  cy.xpath(SELECTED_ACCOUNT).should('not.exist')
  cy.realPress('Escape')
  cy.realPress('Escape')
  cy.xpath(CURRENTLY_SELECTED_ROW).should('not.exist')
})

/**
 * Assum transaction screen. Select an account from the list of balances.
 */
Cypress.Commands.add('selectBalance', (account: string) => {
  cy.box('Balance').find(`[data-cy="Account ${account}"]`).click()
})

/**
 * Find the balance of the account from the balance table assumed be in the page.
 */
Cypress.Commands.add('balance', (account: string): Cypress.Chainable<number> => {
  return cy.box('Balance').find(`[data-cy="Account ${account}"]`).find('td').eq(2).invoke('text').then(text => {
    return parseFloat(text.replace(/ /g, '').replace(/[^0-9]$/g, '').replace(/[,.](\d\d)$/, '.$1').replace(/[^-0-9.]/g, ''))
  })
})
