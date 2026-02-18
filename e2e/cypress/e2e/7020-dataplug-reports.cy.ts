import '../support/commands'

const YEARS = [2017, 2018, 2019, 2020, 2021]
const QUARTERS = [1, 2, 3, 4]

/**
 * Navigate to the dataplug database and select the correct period by year.
 * Uses the API to find the period ID, then navigates via URL.
 */
function selectDataplugPeriod(year: number) {
  const apiUrl = Cypress.expose('API_URL')
  cy.fixture('ci.json').then((config) => {
    cy.request('POST', `${apiUrl}/auth`, {
      user: config.QA_USER,
      password: config.QA_PASSWORD
    }).then((authRes) => {
      cy.request({
        url: `${apiUrl}/db/dataplug/period`,
        headers: { Authorization: `Bearer ${authRes.body.token}` }
      }).then((periodRes) => {
        const period = periodRes.body.find(
          (p: { start_date: string }) => p.start_date === `${year}-01-01`
        )
        cy.visit(`/dataplug/txs/${period.id}`)
        cy.page('TransactionsPage').should('exist')
      })
    })
  })
}

function verifyBalanceSheet(year: number, quarter: number) {
  cy.fixture(`dataplug/${year}-q${quarter}-balance-sheet-detailed.csv`).then((report) => {
    cy.qaLogin()
    cy.language('fi')
    selectDataplugPeriod(year)
    cy.selectReport('balance-sheet-detailed')
    if (quarter !== 4) {
      cy.selectReportOption(`option-quarter${quarter}`)
    } else {
      cy.selectReportOption('option-full')
    }
    cy.report().should('matchReport',
      'Tase tilierittelyin Dataplug Oy',
      /\d+\.\d+\.\d+ 2842358-2/,
      report
    )
  })
}

function verifyIncomeStatement(year: number, quarter: number) {
  cy.fixture(`dataplug/${year}-q${quarter}-income-statement-detailed.csv`).then((report) => {
    cy.qaLogin()
    cy.language('fi')
    selectDataplugPeriod(year)
    cy.selectReport('income-statement-detailed')
    if (quarter !== 4) {
      cy.selectReportOption(`option-quarter${quarter}`)
    } else {
      cy.selectReportOption('option-full')
    }
    cy.toggleReportOption('option-byTags')
    cy.report().should('matchReport',
      'Tuloslaskelma tilierittelyin Dataplug Oy',
      /\d+\.\d+\.\d+ 2842358-2/,
      report
    )
  })
}

describe('Dataplug reports', function() {
  before(function() {
    if (Cypress.expose('MODE') !== 'nightly') {
      this.skip()
    }
  })

  for (const year of YEARS) {
    describe(`${year}`, () => {
      for (const quarter of QUARTERS) {
        it(`Q${quarter} Balance Sheet`, () => verifyBalanceSheet(year, quarter))
        it(`Q${quarter} Income Statement`, () => verifyIncomeStatement(year, quarter))
      }
    })
  }
})
