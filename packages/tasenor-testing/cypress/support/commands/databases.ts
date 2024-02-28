export {}

/**
 * Select the given database.
 */
Cypress.Commands.add('selectDb', (name: string) => {
  cy.goto('⌂')
  cy.list(name).click()
  cy.get('button[id="A"]').click()
  cy.page('TransactionsPage').should('exist')
})
