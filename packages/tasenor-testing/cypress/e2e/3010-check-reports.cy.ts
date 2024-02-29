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
})
