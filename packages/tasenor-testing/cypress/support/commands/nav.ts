/**
 * Select menu and optionally a side menu and an tool icon.
 */
Cypress.Commands.add('goto', (menu: string, listItem: string | null = null, icon: string | null = null) => {
  cy.menu(menu).click()
  if (listItem) {
    cy.list(listItem).click()
  }
  if (icon) {
    cy.icon(icon).click()
  }
})

Cypress.Commands.add('waitLoading', () => {
  cy.get('.MuiBackdrop-root').should('exist')
  cy.get('.MuiBackdrop-root').should('not.exist')
})
