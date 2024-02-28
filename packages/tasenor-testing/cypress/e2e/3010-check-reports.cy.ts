import '../support/commands'
import dayjs from 'dayjs'

describe('Check reports', () => {
  it('Verify Journal', () => {

    cy.fixture('reports/general-journal.csv').then((report) => {
      cy.userLogin()
      cy.selectDb('TEST_DATABASE')
      cy.goto('Reports', 'General Journal')
      // TODO: Move heading check to inspector.
      cy.report('General Journal Robot Oy', dayjs().format('M/D/YYYY')).then(screen => {
      })
    })
  })
})
