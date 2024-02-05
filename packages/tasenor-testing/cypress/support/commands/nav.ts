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

/**
 * Wait that we get loading dimming and then wait until it is gone.
 */
Cypress.Commands.add('waitLoading', () => {
  cy.get('.MuiBackdrop-root').should('be.visible')
  cy.get('.MuiBackdrop-root').should('be.hidden')
})

/**
 * Change the language.
 */
Cypress.Commands.add('language', (lang: string) => {
  if (localStorage.getItem('language') !== lang) {
    localStorage.setItem('language', lang)
    cy.get('.logo').click()
  }
})
