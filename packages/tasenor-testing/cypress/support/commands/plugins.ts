export {}

/**
 * On the admin plugin page, installs one plugin if not installed.
 */
Cypress.Commands.add('installPlugin', (code: string) => {
  cy.plugin(code).then($plugin => {
    if ($plugin.find('[data-cy="button-Install"]').length) {
      cy.wrap($plugin).button('Install').click()
    }
  })
  // Check that remove button is there.
  cy.plugin(code).button('Remove')
})

/**
 * On the plugin page, subscribe one plugin if not subscribed.
 */
Cypress.Commands.add('subscribePlugin', (code: string) => {
  cy.plugin(code).then($plugin => {
    if ($plugin.find('[data-cy="button-Subscribe"]').length) {
      cy.wrap($plugin).button('Subscribe').click()
    }
  })
  // Check that unsubscribe button is there.
  cy.plugin(code).button('Unsubscribe')
})

/**
 * On the plugin page, unsubscribe one plugin.
 */
Cypress.Commands.add('unsubscribePlugin', (code: string) => {
  cy.plugin(code).find('[data-cy="button-Unsubscribe"]').click()
  // Check that subscribe button is there.
  cy.plugin(code).button('Subscribe')
})
