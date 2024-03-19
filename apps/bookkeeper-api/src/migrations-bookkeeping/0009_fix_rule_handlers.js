const { log } = require("@tasenor/common")

exports.up = async function(knex) {
  const data = await knex('importers').select('*')
  for (const importer of data) {
    const handler = importer.config.handlers[0]
    log(`Updating handler to '${handler}' for importer ${importer.id}`)
    delete importer.config.handlers
    importer.config.handler = handler
    await knex('importers').update({ config: importer.config }).where({ id: importer.id })
  }
}

exports.down = async function(knex) {
  const data = await knex('importers').select('*')
  for (const importer of data) {
    const handler = importer.config.handler
    log(`Restoring handlers ['${handler}'] for importer ${importer.id}`)
    delete importer.config.handler
    importer.config.handlers = [handler]
    await knex('importers').update({ config: importer.config }).where({ id: importer.id })
  }
}
