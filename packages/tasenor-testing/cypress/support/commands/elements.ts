/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="cypress" />
export {}

/**
 * Helper to find either chained or root element.
 */
function elem(subject, target, extras = ''): Cypress.Chainable<JQuery<HTMLElement>> {
  if (subject) {
    return cy.wrap(subject).find(`[data-cy="${target}"]${extras ? ' ' : ''}${extras}`)
  } else {
    return cy.get(`[data-cy="${target}"]${extras ? ' ' : ''}${extras}`)
  }
}

/**
 * Low level element accessors.
 */
Cypress.Commands.add('menu', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `menu-${text}`)
})
Cypress.Commands.add('list', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `list-${text}`)
})
Cypress.Commands.add('icon', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `icon-${text}`)
})
Cypress.Commands.add('button', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `button-${text}`)
})
Cypress.Commands.add('text', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `text-${text}`)
})
Cypress.Commands.add('messages', () => {
  return cy.get('[data-cy="snackbar"]').find('[data-cy="message-info"]')
})
Cypress.Commands.add('errors', () => {
  return cy.get('[data-cy="snackbar"]').find('[data-cy="message-error"]')
})
Cypress.Commands.add('plugin', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `plugin-${text}`)
})
Cypress.Commands.add('dialog', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `dialog-${text}`)
})
Cypress.Commands.add('dropdown', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `dropdown-${text}`)
})
Cypress.Commands.add('page', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `page-${text}`)
})
Cypress.Commands.add('accountSelector', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `account-selector-${text}`)
})
Cypress.Commands.add('box', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `box-${text}`)
})

/**
 * Low level element manipulators.
 */
Cypress.Commands.add('form', (fields: Record<string, string>) => {
  Object.keys(fields).forEach(k => {
    cy.text(k).type(fields[k])
  })
})
Cypress.Commands.add('selection', (dropdown: string, item: string) => {
  cy.dropdown(dropdown).click()
  cy.get(`[data-value="${item}"]`).click()
})
