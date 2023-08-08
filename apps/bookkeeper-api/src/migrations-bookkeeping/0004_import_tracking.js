async function up(knex) {
  await knex.schema.createTable('segment_document', function (table) {
    table.integer('process_id').notNullable()
    table.string('segment_id').notNullable()
    table.integer('importer_id').notNullable()
    table.integer('document_id').notNullable()

    table.index(['process_id'])
    table.index(['segment_id'])
    table.index(['importer_id'])
    table.index(['document_id'])
  })
}

async function down(knex) {
  await knex.schema.dropTable('segment_document')
}

module.exports = {
  up, down
}
