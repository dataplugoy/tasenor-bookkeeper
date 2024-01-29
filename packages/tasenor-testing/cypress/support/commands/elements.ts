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
