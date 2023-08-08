async function up(knex) {
  await knex.schema.createTable('importers', function (table) {
    table.increments('id')
    table.string('name', 128).notNullable()
    table.jsonb('config').default({})

    table.datetime('created').defaultTo(knex.fn.now())

    table.index(['name'])
  })
}

async function down(knex) {
  await knex.schema.dropTable('importers')
}

module.exports = {
  up, down
}
