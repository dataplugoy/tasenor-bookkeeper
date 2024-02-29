import '../support/commands'
import dayjs from 'dayjs'

describe('Check reports', () => {
  it('Verify Journal', () => {
    cy.fixture('reports/general-journal.csv').then((report) => {
      cy.userLogin()
      cy.selectDb('TEST_DATABASE')
      cy.goto('Reports', 'General Journal')
      cy.report().should('matchReport', 'General Journal Robot Oy', dayjs().format('M/D/YYYY'), report)
    })
  })

  it('Verify Ledger (in Finnish)', () => {
    cy.fixture('reports/general-ledger.csv').then((report) => {
      cy.language('fi')

      cy.userLogin()
      cy.selectDb('TEST_DATABASE')
      cy.goto('Reports', 'Pääkirja')
      cy.report().should('matchReport', 'Pääkirja Robot Oy', dayjs().format('D.M.YYYY'), report)

      cy.language('en')
    })
  })

  it('Balance sheet', () => {
    cy.fixture('reports/balance-sheet.csv').then((report) => {
      cy.userLogin()
      cy.selectDb('TEST_DATABASE')
      cy.goto('Reports', 'Balance sheet')
      cy.report().should('matchReport', 'Balance sheet Robot Oy', dayjs().format('M/D/YYYY'), report)
    })
  })

  it('Detailed Balance sheet', () => {
    cy.fixture('reports/balance-sheet-detailed.csv').then((report) => {
      cy.userLogin()
      cy.selectDb('TEST_DATABASE')
      cy.goto('Reports', 'Detailed balance sheet')
      cy.report().should('matchReport', 'Detailed balance sheet Robot Oy', dayjs().format('M/D/YYYY'), report)
    })
  })

  it('Income Statement', () => {
    cy.fixture('reports/income-statement.csv').then((report) => {
      cy.userLogin()
      cy.selectDb('TEST_DATABASE')
      cy.goto('Reports', 'Income statement')
      cy.report().should('matchReport', 'Income statement Robot Oy', dayjs().format('M/D/YYYY'), report)
    })
  })

  it('Detailed Income Statement', () => {
    cy.fixture('reports/income-statement-detailed.csv').then((report) => {
      cy.userLogin()
      cy.selectDb('TEST_DATABASE')
      cy.goto('Reports', 'Detailed income statement')
      cy.report().should('matchReport', 'Detailed income statement Robot Oy', dayjs().format('M/D/YYYY'), report)
    })
  })
})
