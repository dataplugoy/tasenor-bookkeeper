import '../support/commands'
import 'cypress-xpath'

describe('Remove users', () => {
  before(() => {
    // Ensure test users exist (may have been deleted by a previous run).
    cy.fixture('ci.json').then((config) => {
      const apiUrl = Cypress.env('API_URL')
      cy.request('POST', `${apiUrl}/auth`, {
        user: config.ADMIN_USER,
        password: config.ADMIN_PASSWORD
      }).then((authRes) => {
        const token = authRes.body.token
        cy.request({
          url: `${apiUrl}/admin/user`,
          headers: { Authorization: `Bearer ${token}` }
        }).then((usersRes) => {
          const emails = usersRes.body.map((u: { email: string }) => u.email)

          if (!emails.includes(config.USER)) {
            cy.request({
              method: 'POST',
              url: `${apiUrl}/admin/user`,
              headers: { Authorization: `Bearer ${token}` },
              body: { name: config.USER, password: config.PASSWORD, email: config.EMAIL }
            })
          }

          if (!emails.includes(config.QA_USER)) {
            cy.request({
              method: 'POST',
              url: `${apiUrl}/admin/user`,
              headers: { Authorization: `Bearer ${token}` },
              body: { name: 'QA', password: config.QA_PASSWORD, email: config.QA_USER }
            })
          }

          if (!emails.includes('noname@outside')) {
            cy.request({
              method: 'POST',
              url: `${apiUrl}/admin/user`,
              headers: { Authorization: `Bearer ${token}` },
              body: { name: 'Noname Outsider', password: 'passpass', email: 'noname@outside' }
            })
          }
        })
      })
    })
  })

  it('Try to remove user with wrong email', () => {

    cy.fixture('ci.json').then((config) => {
      cy.adminLogin()
      cy.goto('Admin', 'Users')

      // Select user from the list
      cy.get(`[id="user-${config.USER}"]`).click()

      // Try delete with wrong email
      cy.get('#delete-user').click()
      cy.get('[name="deleted-user-email"]').type(`${config.EMAIL}FAIL`)
      cy.get('#OK').click()

      cy.shouldHaveError('Email was not given correctly.')
    })
  })

  it('Actually remove test user', () => {

    cy.fixture('ci.json').then((config) => {
      cy.adminLogin()
      cy.goto('Admin', 'Users')

      cy.get(`[id="user-${config.USER}"]`).click()
      cy.get('#delete-user').click()
      cy.get('[name="deleted-user-email"]').type(config.EMAIL)
      cy.get('#OK').click()

      cy.shouldHaveInfo('User deleted permanently.')
    })
  })

  it('Delete QA user', () => {

    cy.fixture('ci.json').then((config) => {
      cy.adminLogin()
      cy.goto('Admin', 'Users')

      cy.get(`[id="user-${config.QA_USER}"]`).click()
      cy.get('#delete-user').click()
      cy.get('[name="deleted-user-email"]').type(config.QA_USER)
      cy.get('#OK').click()

      cy.shouldHaveInfo('User deleted permanently.')
    })
  })

  it('Delete registered user', () => {

    cy.adminLogin()
    cy.goto('Admin', 'Users')

    cy.get('[id="user-noname@outside"]').click()
    cy.get('#delete-user').click()
    cy.get('[name="deleted-user-email"]').type('noname@outside')
    cy.get('#OK').click()

    cy.shouldHaveInfo('User deleted permanently.')
  })
})
