import '../support/commands'
import 'cypress-xpath'

describe('VAT operations', () => {
  it('Calculate VAT', () => {

    cy.userLogin()
    cy.language('en')
    cy.selectDb('TEST_DATABASE')
    cy.gotoTools()
    cy.selectTool('Value Added Tax')

    cy.contains('Current VAT receivable: 0,00€')
    cy.contains('Current VAT payable: 0,00€')
    cy.contains('Cumulated VAT from purchases: 60,00€')
    cy.contains('Cumulated VAT from sales: -58,06€')
    cy.contains('Receivable to add: 1,94€')

    cy.clickToolIcon('Summarize VAT')

    cy.contains('Delayed VAT: 1,94€')
    cy.contains('Current VAT payable: 0,00€')
    cy.contains('Cumulated VAT from purchases: 0,00€')
    cy.contains('Cumulated VAT from sales: 0,00€')
    cy.contains('Receivable to add: 0,00€')
  })

  it('Verify VAT from report', () => {

    cy.userLogin()
    cy.language('fi')
    cy.selectDb('TEST_DATABASE')

    cy.selectReport('balance-sheet')
    cy.reportLine('Siirtosaamiset', '1,94€')
    cy.reportLine('Muut velat', '0,00€')

    cy.selectReport('balance-sheet-detailed')
    cy.reportLine('1845 Arvonlisäverosaamiset ennakkomaksuista (siirtosaamiset)', '1,94€')
    cy.reportLine('Siirtosaamiset yhteensä', '1,94€')
    cy.reportLine('Saamiset yhteensä', '1,94€')
  })
})
