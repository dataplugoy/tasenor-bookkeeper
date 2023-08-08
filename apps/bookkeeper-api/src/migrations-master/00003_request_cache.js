exports.up = async function(knex) {
  await knex.schema.createTable('cached_requests', function (table) {
    table.increments('id')

    table.datetime('created').notNullable().defaultTo(knex.fn.now())
    table.string('method').notNullable()
    table.string('url').notNullable()
    table.jsonb('query').defaultTo({})
    table.jsonb('headers').defaultTo({})
    table.integer('status').unsigned().defaultTo(null)
    table.jsonb('result').defaultTo({})

    table.index(['method', 'url'])
    table.index('created')
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable('cached_requests')
}
