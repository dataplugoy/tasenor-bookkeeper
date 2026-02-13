import '../support/commands'
import 'cypress-xpath'

describe('Account editing', () => {
  it('Test creating accounts', () => {

    cy.userLogin()
    cy.selectDb('TEST_DATABASE')
    cy.gotoAccounts()

    cy.createAccount('1915', 'Candy Bank', 'ASSET')
    cy.createAccount('2625', 'Loan for candy', 'LIABILITY')
    cy.createAccount('4005', 'Candy purchases', 'EXPENSE')
    cy.createAccount('3005', 'Candy sales', 'REVENUE')
  })

  it('Browse created accounts', () => {

    cy.userLogin()
    cy.language('en')
    cy.selectDb('TEST_DATABASE')
    cy.gotoAccounts()

    cy.selectAccountFromList('1915')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='name']//*[text()='Candy Bank']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='number']//*[text()='1915']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='type']//*[text()='Assets']").should('exist')

    cy.selectAccountFromList('2625')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='name']//*[text()='Loan for candy']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='number']//*[text()='2625']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='type']//*[text()='Liabilities']").should('exist')

    cy.selectAccountFromList('4005')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='name']//*[text()='Candy purchases']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='number']//*[text()='4005']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='type']//*[text()='Expenses']").should('exist')

    cy.selectAccountFromList('3005')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='name']//*[text()='Candy sales']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='number']//*[text()='3005']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='type']//*[text()='Revenue']").should('exist')
  })

  it('Edit created accounts', () => {

    cy.userLogin()
    cy.selectDb('TEST_DATABASE')
    cy.gotoAccounts()

    // Edit 1915 name
    cy.selectAccountFromList('1915')
    cy.get('#EditAccount').click()
    cy.get('[name="account_name"]').type('{selectall}{backspace}')
    cy.get('[name="account_name"]').type('Candy Loan Sharks')
    cy.get('#OK').click()

    // Edit 2625 number to 2626
    cy.selectAccountFromList('2625')
    cy.get('#EditAccount').click()
    cy.get('[name="account_number"]').type('{selectall}{backspace}')
    cy.get('[name="account_number"]').type('2626')
    cy.get('#OK').click()
  })

  it('Browse edited accounts', () => {

    cy.userLogin()
    cy.language('en')
    cy.selectDb('TEST_DATABASE')
    cy.gotoAccounts()

    cy.selectAccountFromList('1915')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='name']//*[text()='Candy Loan Sharks']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='number']//*[text()='1915']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='type']//*[text()='Assets']").should('exist')

    cy.selectAccountFromList('2626')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='name']//*[text()='Loan for candy']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='number']//*[text()='2626']").should('exist')
    cy.xpath("//*[contains(@class, 'AccountInfoPanel')]//*[@class='type']//*[text()='Liabilities']").should('exist')
  })

  it('Delete created and edited accounts', () => {

    cy.userLogin()
    cy.selectDb('TEST_DATABASE')
    cy.gotoAccounts()

    cy.selectAccountFromList('1915')
    cy.get('#DeleteAccount').click()
    cy.get('#OK').click()
    cy.get('.DeleteAccountDialog').should('not.exist')

    cy.selectAccountFromList('2626')
    cy.get('#DeleteAccount').click()
    cy.get('#OK').click()
    cy.get('.DeleteAccountDialog').should('not.exist')

    cy.selectAccountFromList('4005')
    cy.get('#DeleteAccount').click()
    cy.get('#OK').click()
    cy.get('.DeleteAccountDialog').should('not.exist')

    cy.selectAccountFromList('3005')
    cy.get('#DeleteAccount').click()
    cy.get('#OK').click()
    cy.get('.DeleteAccountDialog').should('not.exist')
  })

  it('Verify that accounts are deleted', () => {

    cy.userLogin()
    cy.selectDb('TEST_DATABASE')
    cy.gotoAccounts()

    cy.contains('1915 Candy Bank').should('not.exist')
    cy.contains('2625 Loan for candy').should('not.exist')
    cy.contains('4005 Candy purchases').should('not.exist')
    cy.contains('3005 Candy sales').should('not.exist')
  })
})
