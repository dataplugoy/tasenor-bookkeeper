exports.up = async function(knex) {
  await knex.schema.createTable('users', function (table) {
    table.increments('id')

    table.string('email', 32).notNullable()
    table.string('password', 256).notNullable()
    table.string('name', 64).defaultTo(null)
    table.jsonb('config').notNullable()
    table.datetime('created').notNullable().defaultTo(knex.fn.now())

    table.unique('email')
  })

  await knex.schema.createTable('databases', function (table) {
    table.increments('id')

    table.string('name', 32).notNullable()
    table.string('host', 64).notNullable()
    table.integer('port').notNullable()
    table.string('user', 32).notNullable()
    table.string('password', 256).notNullable()
    table.jsonb('config').notNullable()
    table.datetime('created').notNullable().defaultTo(knex.fn.now())

    table.unique('name')
  })

  await knex.schema.createTable('database_users', function (table) {
    table.integer('user_id').notNullable()
    table.integer('database_id').notNullable()
    table.jsonb('config').notNullable()
    table.datetime('created').notNullable().defaultTo(knex.fn.now())

    table.foreign('user_id').references('users.id')
    table.foreign('database_id').references('databases.id')

    table.unique(['user_id', 'database_id'])
    table.index(['database_id', 'user_id'])
  })

  await knex.schema.createTable('settings', function (table) {
    table.string('name', 64).notNullable()
    table.jsonb('value').defaultTo(null)
    table.unique('name')
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable('database_users')
  await knex.schema.dropTable('users')
  await knex.schema.dropTable('databases')
  await knex.schema.dropTable('settings')
}
