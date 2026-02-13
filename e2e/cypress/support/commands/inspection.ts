/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
/// <reference types=".." />

/**
 * Find the currently selected database name.
 */
export function currentDB(): Cypress.Chainable<string> {
  return cy.location().then(loc => loc.pathname.split('/')[1] || '')
}

/**
 * Find the name of the currently selected main menu.
 */
export function currentPage(): Cypress.Chainable<string> {
  return cy.location().then(loc => loc.pathname.split('/')[2] || 'dashboard')
}

/**
 * Find the period ID of the current period.
 */
export function currentPeriod(): Cypress.Chainable<number> {
  return cy.location().then(loc => parseInt(loc.pathname.split('/')[3] || '0'))
}

/**
 * Find the account ID of the current account.
 */
export function currentAccount(): Cypress.Chainable<number> {
  return cy.location().then(loc => parseInt(loc.pathname.split('/')[4] || '0'))
}

/**
 * Find the currently selected language.
 */
export function currentLanguage(): Cypress.Chainable<string> {
  return cy.getAllLocalStorage().then(store => {
    const sites = Object.values(store)
    if (sites.length) {
      if (typeof sites[0].language === 'string') {
        return sites[0].language
      }
    }
    return 'en'
  })
}
