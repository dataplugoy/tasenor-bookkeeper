exports.up = async function(knex) {
  await knex.schema.alterTable('account', function (table) {
    table.dropColumn('vat_percentage')
    table.string('vat', 64).defaultTo(null)
  })
}

exports.down = async function(knex) {
  await knex.schema.alterTable('account', function (table) {
    table.dropColumn('vat')
    table.decimal('vat_percentage', 5, 2).defaultTo(null)
  })
}
