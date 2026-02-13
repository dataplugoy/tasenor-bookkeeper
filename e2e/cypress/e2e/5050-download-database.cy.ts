import '../support/commands'
import 'cypress-xpath'

describe('Download database', () => {
  it('Verify that downloaded database is correct', () => {

    cy.fixture('ci.json').then((config) => {
      cy.userLogin()
      cy.selectDb(config.TEST_DATABASE)
      cy.gotoTools()

      // Click download for the test database
      cy.xpath(`//*[text()='${config.TEST_DATABASE}']/../../..//*[text()='Download' or text()='Lataa']`)
        .should('be.visible')
        .click()

      // Wait for .tasenor file download
      const downloadsFolder = Cypress.config('downloadsFolder')
      cy.readFile(`${downloadsFolder}/${config.TEST_COMPANY}.tasenor`, null, { timeout: 60_000 })
        .should('exist')

      // Compare tar contents
      cy.fixture('downloads/Robot_Oy.tasenor', null).then((expectedBuffer) => {
        const expectedPath = `${downloadsFolder}/expected_Robot_Oy.tasenor`
        cy.writeFile(expectedPath, expectedBuffer, null)
        cy.task('compareTarPackages', {
          actual: `${downloadsFolder}/${config.TEST_COMPANY}.tasenor`,
          expected: expectedPath,
        }).should('be.null')
      })
    })
  })
})
