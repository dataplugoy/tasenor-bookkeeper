import '../support/commands'
import 'cypress-xpath'

describe('Remove users', () => {
  it('Try to remove user with wrong email', () => {

    cy.fixture('ci.json').then((config) => {
      cy.adminLogin()
      cy.goto('Admin', 'Users')

      // Select user from the list
      cy.xpath(`//*[contains(@class, "UserList")]//*[text()='${config.USER}']`).click()

      // Try delete with wrong email
      cy.get('#delete-user').click()
      cy.get('#deleted-user-email').type(`${config.EMAIL}FAIL`)
      cy.get('#OK').click()

      cy.shouldHaveError('Email was not given correctly.')
    })
  })

  it('Actually remove test user', () => {

    cy.fixture('ci.json').then((config) => {
      cy.adminLogin()
      cy.goto('Admin', 'Users')

      cy.xpath(`//*[contains(@class, "UserList")]//*[text()='${config.USER}']`).click()
      cy.get('#delete-user').click()
      cy.get('#deleted-user-email').type(config.EMAIL)
      cy.get('#OK').click()

      cy.shouldHaveInfo('User deleted permanently.')
    })
  })

  it('Delete QA user', () => {

    cy.fixture('ci.json').then((config) => {
      cy.adminLogin()
      cy.goto('Admin', 'Users')

      cy.xpath(`//*[contains(@class, "UserList")]//*[text()='${config.QA_USER}']`).click()
      cy.get('#delete-user').click()
      cy.get('#deleted-user-email').type(config.QA_USER)
      cy.get('#OK').click()

      cy.shouldHaveInfo('User deleted permanently.')
    })
  })

  it('Delete registered user', () => {

    cy.adminLogin()
    cy.goto('Admin', 'Users')

    cy.xpath("//*[contains(@class, 'UserList')]//*[text()='noname@outside']").click()
    cy.get('#delete-user').click()
    cy.get('#deleted-user-email').type('noname@outside')
    cy.get('#OK').click()

    cy.shouldHaveInfo('User deleted permanently.')
  })
})
