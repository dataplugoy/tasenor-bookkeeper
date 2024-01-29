/**
 * Select menu and optionally a side menu and an tool icon.
 */
Cypress.Commands.add('goto', (menu: string, listItem: string, icon: string | null = null) => {
  cy.menu(menu).click()
  cy.list(listItem).click()
  if (icon) {
    cy.icon(icon).click()
  }
})
