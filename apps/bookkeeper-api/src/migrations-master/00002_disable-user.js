exports.up = async function(knex) {
  await knex.schema.alterTable('users', function (table) {
    table.boolean('disabled').notNullable().defaultTo(false)
  })
}

exports.down = async function(knex) {
  await knex.schema.alterTable('users', function (table) {
    table.dropColumn('disabled')
  })
}
