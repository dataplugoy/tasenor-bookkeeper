export {}

/**
 * Select the given database. Name can be either database name or configuration variable name.
 */
Cypress.Commands.add('selectDb', (name: string) => {
  cy.fixture('ci.json').then((config) => {
    if (name in config) {
      name = config[name]
    }
    cy.goto('⌂')
    cy.list(name).click()
    cy.get('button[id="A"]').click()
    cy.page('TransactionsPage').should('exist')
  })
})
