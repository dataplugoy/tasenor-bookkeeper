import '../support/commands'
import 'cypress-xpath'
import 'cypress-real-events'

describe('Period operations', () => {
  before(() => {
    // Clean up stale state from previous failed runs via API.
    cy.fixture('ci.json').then((config) => {
      const apiUrl = Cypress.expose('API_URL')

      // Login to get a token.
      cy.request('POST', `${apiUrl}/auth`, {
        user: config.USER,
        password: config.PASSWORD
      }).then((authRes) => {
        const token = authRes.body.token

        // List all periods.
        cy.request({
          url: `${apiUrl}/db/${config.TEST_DATABASE}/period`,
          headers: { Authorization: `Bearer ${token}` }
        }).then((periodsRes) => {
          const periods = periodsRes.body

          // Unlock the YEAR period if locked.
          const yearPeriod = periods.find((p: { start_date: string }) => p.start_date === `${config.YEAR}-01-01`)
          if (yearPeriod && yearPeriod.locked) {
            cy.request({
              method: 'PATCH',
              url: `${apiUrl}/db/${config.TEST_DATABASE}/period/${yearPeriod.id}`,
              headers: { Authorization: `Bearer ${token}` },
              body: { locked: false }
            })
          }

          // Delete the NEXT_YEAR period if it exists.
          const nextYearPeriod = periods.find((p: { start_date: string }) => p.start_date === `${config.NEXT_YEAR}-01-01`)
          if (nextYearPeriod) {
            // List documents in the period.
            cy.request({
              url: `${apiUrl}/db/${config.TEST_DATABASE}/document?period=${nextYearPeriod.id}`,
              headers: { Authorization: `Bearer ${token}` }
            }).then((docsRes) => {
              const docs = docsRes.body
              // Delete each document (cascades entries).
              for (const doc of docs) {
                cy.request({
                  method: 'DELETE',
                  url: `${apiUrl}/db/${config.TEST_DATABASE}/document/${doc.id}`,
                  headers: { Authorization: `Bearer ${token}` }
                })
              }
              // Delete the period.
              cy.request({
                method: 'DELETE',
                url: `${apiUrl}/db/${config.TEST_DATABASE}/period/${nextYearPeriod.id}`,
                headers: { Authorization: `Bearer ${token}` }
              })
            })
          }
        })
      })
    })
  })

  it('Create new period', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.language('en')
      cy.selectDb(config.TEST_DATABASE)
      cy.gotoTools()
      cy.selectTool('Periods')

      // Verify existing period
      cy.get('table').should('cellEquals', 1, 1, `${config.YEAR}-01-01`)
      cy.get('table').should('cellEquals', 1, 2, `${config.YEAR}-12-31`)

      // Create new period
      cy.createPeriod()

      // Verify new period
      cy.get('table').should('cellEquals', 2, 1, `${config.NEXT_YEAR}-01-01`)
      cy.get('table').should('cellEquals', 2, 2, `${config.NEXT_YEAR}-12-31`)

      // Select the new period and verify carried-forward balances
      cy.goto('⌂')
      cy.list(config.TEST_DATABASE).click()
      cy.selectPeriod(`${config.NEXT_YEAR}-01-01`, `${config.NEXT_YEAR}-12-31`)

      cy.accountBalanceShouldBe('1845', '1,94€')
      cy.accountBalanceShouldBe('1900', '15 990,00€')
      cy.accountBalanceShouldBe('2001', '-2 500,00€')
      cy.accountBalanceShouldBe('2251', '8,06€')
      cy.accountBalanceShouldBe('2621', '-7 500,00€')
      cy.accountBalanceShouldBe('2622', '-6 000,00€')
    })
  })

  it('Lock a period', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.language('en')
      cy.selectDb(config.TEST_DATABASE)
      cy.gotoTools()
      cy.selectTool('Periods')

      // Lock the first period
      cy.lockPeriod(`${config.YEAR}-01-01`)
      cy.get('table').should('cellEquals', 1, 3, 'Locked')

      // Select database and period, then try editing
      cy.goto('⌂')
      cy.list(config.TEST_DATABASE).click()
      cy.selectPeriod(`${config.YEAR}-01-01`, `${config.YEAR}-12-31`)
      cy.selectBalance('1900')
      cy.selectNamedTx('Loan from Business Bank')

      // Try to go to first line description and edit
      cy.realPress('ArrowDown')
      cy.xpath('//*[contains(@class, "TransactionDetails")][contains(@class, "account")][contains(@class, "sub-selected")]').should('exist')
      cy.realPress('ArrowRight')
      cy.xpath('//*[contains(@class, "TransactionDetails")][contains(@class, "description")][contains(@class, "sub-selected")]').should('exist')
      cy.realPress('Enter')

      cy.shouldHaveError('Cannot edit this entry. Period locked?')
    })
  })
})
