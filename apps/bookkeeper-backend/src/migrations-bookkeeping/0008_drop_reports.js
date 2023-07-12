exports.up = async function(knex) {
  await knex.schema.dropTable('report')
}

exports.down = async function(knex) {
  await knex.schema.createTable('report', function (table) {
    table.string('id', 64).notNullable()
    table.text('data').notNullable()
  })
}
