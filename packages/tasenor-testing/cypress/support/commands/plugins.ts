/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
/// <reference types=".." />

export {}

/**
 * On the admin plugin page, installs one plugin if not installed.
 */
Cypress.Commands.add('installPlugin', (code: string) => {
  cy.plugin(code).then($plugin => {
    if ($plugin.find('[data-cy="button-Install"]').length) {
      cy.plugin(code).button('Install').click()
    }
  })
})

/**
 * On the plugin page, subscribe one plugin if not subscribed.
 */
Cypress.Commands.add('subscribePlugin', (code: string) => {
  cy.plugin(code).then($plugin => {
    if ($plugin.find('[data-cy="button-Subscribe"]').length) {
      cy.plugin(code).button('Subscribe').click()
    }
  })
})

/**
 * On the plugin page, unsubscribe one plugin.
 */
Cypress.Commands.add('unsubscribePlugin', (code: string) => {
  cy.plugin(code).find('[data-cy="button-Unsubscribe"]').click()
})
