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
Cypress.Commands.add('menu', (text: string) => {
  return elem(null, `menu-${text}`)
})
Cypress.Commands.add('list', (text: string) => {
  return elem(null, `list-${text}`)
})
Cypress.Commands.add('icon', (text: string) => {
  return elem(null, `icon-${text}`)
})
Cypress.Commands.add('button', { prevSubject: 'optional' }, (subject, text: string) => {
  return elem(subject, `button-${text}`)
})
Cypress.Commands.add('text', (text: string) => {
  return elem(null, `text-${text}`)
})
Cypress.Commands.add('messages', () => {
  return cy.get('[data-cy="snackbar"]').find('[data-cy="message-info"]')
})
Cypress.Commands.add('errors', () => {
  return cy.get('[data-cy="snackbar"]').find('[data-cy="message-error"]')
})
Cypress.Commands.add('plugin', (text: string) => {
  return elem(null, `plugin-${text}`)
})
Cypress.Commands.add('dialog', (text: string) => {
  return elem(null, `dialog-${text}`)
})
Cypress.Commands.add('dropdown', (text: string) => {
  return elem(null, `dropdown-${text}`)
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
