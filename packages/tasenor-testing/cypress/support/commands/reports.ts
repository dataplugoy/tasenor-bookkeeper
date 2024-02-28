export {}

/**
 * Gather the report data from the table on the screen.
 */
Cypress.Commands.add('report', (heading1: string, heading2: string): Cypress.Chainable<string[][]> => {
  return cy.box('Report').then(table => {
    const rows = table.find('tr')
    const report: string[][] = []
    rows.each(function(row) {
      const columns = Cypress.$(this).find('td')
      const texts: string[] = []
      columns.each(function(col) {
        let str = ''
        if (this.children.length) {
          Cypress.$(this.children).each(function() {
            const piece = Cypress.$(this).text()
            if (piece !== '') {
              if (str !== '') {
                str += ' '
              }
              str += piece
            }
          })
        } else {
          str = Cypress.$(this).text()
        }
        texts.push(str)
      })
      report.push(texts)
    })

    if (report[0].join(' ') !== heading1) {
      throw new Error(`First heading of the report '${report[0].join(' ')}' does not match expected '${heading1}'.`)
    }
    if (report[1].join(' ') !== heading2) {
      throw new Error(`Second heading of the report '${report[1].join(' ')}' does not match expected '${heading2}'.`)
    }

    return report.slice(2)
  })
})
