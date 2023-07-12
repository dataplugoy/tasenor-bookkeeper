exports.up = async function(knex) {
  await knex.schema.createTable('account', function (table) {
    table.increments('id')

    table.string('number', 12).notNullable()
    table.string('name', 128).notNullable()
    table.enum('type',
      ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'PROFIT_PREV', 'PROFIT'],
      { useNative: true, enumName: 'account_type' }).notNullable()
    table.string('currency', 3).notNullable()
    table.string('language', 2).notNullable()
    table.decimal('vat_percentage', 5, 2).defaultTo(null)
    table.boolean('favourite').defaultTo(false)

    table.unique(['language', 'number'])
    table.index('number')
  })

  await knex.schema.createTable('heading', function (table) {
    table.increments('id')

    table.string('number', 12).notNullable()
    table.string('text', 128).notNullable()
    table.integer('level').notNullable()

    table.index('number')
  })

  await knex.schema.createTable('period', function (table) {
    table.increments('id')

    table.date('start_date').notNullable()
    table.date('end_date').notNullable()
    table.boolean('locked').defaultTo(false)

    table.index('start_date')
  })

  await knex.schema.createTable('document', function (table) {
    table.increments('id')

    table.integer('number').unsigned().notNullable()
    table.date('date').notNullable()
    table.integer('period_id').notNullable()
    table.jsonb('data').defaultTo({})

    table.foreign('period_id').references('period.id')

    table.unique(['period_id', 'number'])
    table.index(['period_id', 'date'])
  })

  await knex.schema.createTable('entry', function (table) {
    table.increments('id')

    table.integer('document_id').notNullable()
    table.integer('account_id').notNullable()
    table.boolean('debit').defaultTo(false)
    table.decimal('amount', 32, 2).notNullable()
    table.string('description', 256).notNullable()
    table.integer('row_number').unsigned().defaultTo(1)
    table.jsonb('data').defaultTo({})

    table.foreign('document_id').references('document.id')
    table.foreign('account_id').references('account.id')

    table.index(['document_id', 'row_number'])
  })

  await knex.schema.createTable('report', function (table) {
    table.string('id', 64).notNullable()
    table.text('data').notNullable()
  })

  await knex.schema.createTable('tags', function (table) {
    table.increments('id')

    table.string('tag', 16).notNullable()
    table.string('name', 256).notNullable()
    table.string('mime', 128).notNullable()
    table.binary('picture').notNullable()
    table.string('type', 16).notNullable()
    table.integer('order').unsigned().defaultTo(1)

    table.unique('tag')
    table.index('order')
  })

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

  await knex.schema.createTable('settings', function (table) {
    table.string('name', 128).notNullable()
    table.jsonb('value').defaultTo(null)
    table.unique('name')
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable('cached_requests')
  await knex.schema.dropTable('entry')
  await knex.schema.dropTable('document')
  await knex.schema.dropTable('account')
  await knex.schema.dropTable('heading')
  await knex.schema.dropTable('period')
  await knex.schema.dropTable('report')
  await knex.schema.dropTable('tags')
  await knex.schema.dropTable('settings')
  await knex.schema.raw('DROP TYPE account_type')
}
