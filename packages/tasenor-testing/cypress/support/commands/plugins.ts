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
