import '../support/commands'

describe('Upload Dataplug database', () => {
  it('Upload Dataplug.tasenor via API', function() {
    if (Cypress.expose('MODE') !== 'nightly') {
      this.skip()
    }

    const apiUrl = Cypress.expose('API_URL')
    const filePath = Cypress.config('fixturesFolder') + '/databases/Dataplug.tasenor'

    cy.fixture('ci.json').then((config) => {
      cy.task('uploadDatabase', {
        filePath,
        apiUrl,
        user: config.QA_USER,
        password: config.QA_PASSWORD,
      }, { timeout: 120_000 }).should('be.null')
    })
  })

  it('Verify Dataplug database appears in UI', function() {
    if (Cypress.expose('MODE') !== 'nightly') {
      this.skip()
    }

    cy.qaLogin()
    cy.goto('\u2302')
    cy.list('dataplug').should('exist')
  })
})
