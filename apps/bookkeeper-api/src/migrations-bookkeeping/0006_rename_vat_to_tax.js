exports.up = async function(knex) {
  await knex.schema.alterTable('account', function (table) {
    table.renameColumn('vat', 'tax')
  })
}

exports.down = async function(knex) {
  await knex.schema.alterTable('account', function (table) {
    table.renameColumn('tax', 'vat')
  })
}
