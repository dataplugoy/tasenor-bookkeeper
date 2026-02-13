import '../support/commands'

describe('Downloadable reports', () => {
  it('Verify that download account CSV is correct', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.language('fi')
      cy.selectDb(config.TEST_DATABASE)

      const accounts = ['1900', '29391', '29392', '7680']

      accounts.forEach((account) => {
        cy.selectBalance(account)
        cy.get('#Download').click()

        const downloadsFolder = Cypress.config('downloadsFolder')
        const fileName = `transactions-1-${account}.csv`

        cy.readFile(`${downloadsFolder}/${fileName}`, { timeout: 60_000 }).then((downloaded) => {
          cy.fixture(`downloads/transactions-1-${account}.csv`).then((expected) => {
            expect(downloaded.trim()).to.equal(expected.trim())
          })
        })
      })
    })
  })
})
