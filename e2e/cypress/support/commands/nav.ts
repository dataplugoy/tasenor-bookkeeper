/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
/// <reference types="cypress-xpath" />
/// <reference types=".." />

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

/**
 * Navigate to the Tools page.
 */
Cypress.Commands.add('gotoTools', () => {
  cy.menu('Tools').click()
  cy.get('.ToolsForDatabasesPage').should('exist')
})

/**
 * Navigate to the Accounts page.
 */
Cypress.Commands.add('gotoAccounts', () => {
  cy.menu('Accounts').click()
  cy.get('.AccountsPage').should('exist')
})

/**
 * Select a tool by clicking its button text.
 */
Cypress.Commands.add('selectTool', (tool: string) => {
  cy.xpath(`//*[@role="button"]//*[text()='${tool}']`).should('be.visible').click()
})

/**
 * Click an icon in the main top panel.
 */
Cypress.Commands.add('clickToolIcon', (icon: string) => {
  cy.xpath(`//*[contains(@class, "MainTopPanel")]//*[@id="${icon}"]`).should('be.visible').click()
})
