import '../support/commands'
import 'cypress-xpath'

describe('Registration settings', () => {
  it('Enable registration in system settings', () => {

    cy.adminLogin()

    // Go to Settings > System Settings (tab 3)
    cy.get('#Edit\\ Settings').click()
    cy.xpath("//*[contains(@class, 'Title')]/h5[text() = 'Personal Information']").should('be.visible')
    cy.get('#3').click()
    cy.xpath("//*[contains(@class, 'Title')]/h5[text() = 'System Settings']").should('be.visible')

    // Toggle canRegister
    cy.get('[name="canRegister"][type="checkbox"]').click()

    // Save
    cy.xpath("//*[@type='button'][text()='Save']").click()
    cy.messages().should('contain.text', 'System settings saved.')

    cy.logout()
  })

  it('Register new user', () => {

    cy.visit('/')
    cy.get('#Register\\ an\\ account').click()

    cy.get('[name="full-name"]').type('Noname Outsider')
    cy.get('[name="email"]').type('noname@outside')
    cy.get('[name="password"]').type('passpass')
    cy.get('[name="password-again"]').type('passpass')
    cy.get('#submit').click()

    cy.messages().should('contain.text', 'User account registered successfully.')
  })
})
