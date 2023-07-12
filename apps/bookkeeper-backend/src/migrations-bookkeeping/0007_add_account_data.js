exports.up = async function(knex) {
  await knex.schema.alterTable('account', function (table) {
    table.jsonb('data').defaultTo({})
  })
  const accounts = await knex('account').select('id', 'favourite', 'tax')
  for (const account of accounts) {
    const data = {}
    let changes = false
    if (account.favourite) {
      data.favourite = true
      changes = true
    }
    if (account.tax !== null) {
      data.code = account.tax
      changes = true
    }
    if (changes) {
      await knex('account').update({ data }).where({ id: account.id })
    }
  }
  await knex.schema.alterTable('account', function (table) {
    table.dropColumn('favourite')
    table.dropColumn('tax')
  })
}

exports.down = async function(knex) {
  await knex.schema.alterTable('account', function (table) {
    table.boolean('favourite').defaultTo(false)
    table.string('tax', 64).defaultTo(null)
  })

  const accounts = await knex('account').select('id', 'data')
  for (const account of accounts) {
    await knex('account').update({ favourite: !!account.data.favourite, tax: account.data.code || null }).where({ id: account.id })
  }
  await knex.schema.alterTable('account', function (table) {
    table.dropColumn('data')
  })
}
