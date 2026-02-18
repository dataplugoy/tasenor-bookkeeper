import '../support/commands'

describe('Account filtering', () => {
  it('Check basic account listing filtering', () => {

    cy.userLogin()
    cy.selectDb('TEST_DATABASE')
    cy.gotoAccounts()

    // All types should be visible
    cy.contains('1900 Käteisvarat')
    cy.contains('2871 Ostovelat 1')
    cy.contains('2001 Osakepääoma')
    cy.contains('3000 Myynti')
    cy.contains('4000 Ostot')
    cy.contains('2251 Edellisten tilikausien voitto/tappio')

    // Hide all
    cy.get('#HideAll').click()
    cy.contains('1900 Käteisvarat').should('not.exist')
    cy.contains('2871 Ostovelat 1').should('not.exist')
    cy.contains('2001 Osakepääoma').should('not.exist')
    cy.contains('3000 Myynti').should('not.exist')
    cy.contains('4000 Ostot').should('not.exist')
    cy.contains('2251 Edellisten tilikausien voitto/tappio').should('not.exist')

    // Toggle each type individually
    cy.get('#Asset').click()
    cy.contains('1900 Käteisvarat')

    cy.get('#Liability').click()
    cy.contains('2871 Ostovelat 1')

    cy.get('#Equity').click()
    cy.contains('2001 Osakepääoma')

    cy.get('#Revenue').click()
    cy.contains('3000 Myynti')

    cy.get('#Expense').click()
    cy.contains('4000 Ostot')

    cy.get('#Profit').click()
    cy.contains('2251 Edellisten tilikausien voitto/tappio')

    // Show all
    cy.get('#ShowAll').click()
  })

  it('Test searching accounts with text', () => {

    cy.userLogin()
    cy.selectDb('TEST_DATABASE')
    cy.gotoAccounts()

    // Search by number
    cy.get('[name="search"]').type('1900')
    cy.get('[name="search"]').type('{enter}')
    cy.contains('1900 Käteisvarat')

    // Clear and search by name
    cy.get('[name="search"]').type('{selectall}{backspace}')
    cy.get('[name="search"]').type('Arvonlisäverovelka')
    cy.get('[name="search"]').type('{enter}')
    cy.contains('2939 Arvonlisäverovelka')

    // Clear search
    cy.get('[name="search"]').type('{selectall}{backspace}{enter}')
  })
})
