/**
 * Proposed documents waiting for a person to confirm them.
 *
 * Drafts live in their own table rather than as a flag on `document`, so that no report, balance
 * or importer query can ever count one by accident. Confirming a draft creates an ordinary
 * document from it and deletes the draft.
 */
exports.up = async function(knex) {
  await knex.schema.createTable('draft', function (table) {
    table.increments('id')
    table.integer('period_id').notNullable()
    table.date('date').notNullable()
    table.string('description', 256).notNullable()
    // Entries as [{ account_id, debit, amount (cents), description }].
    table.jsonb('entries').notNullable()
    // Free-form context: source (e.g. "mcp"), note, attachments...
    table.jsonb('data').defaultTo({})
    table.string('created_by', 256).notNullable()
    table.timestamp('created').notNullable().defaultTo(knex.fn.now())

    table.foreign('period_id').references('period.id')
    table.index(['period_id', 'date'])
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable('draft')
}
