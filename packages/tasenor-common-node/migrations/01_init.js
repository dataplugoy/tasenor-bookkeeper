async function up(knex) {
    if (await knex.schema.hasTable('processes')) {
        console.log('Found processes table. Skipping migrations.')
        return
    }
    await knex.schema.createTable('processes', function (table) {
        table.increments('id')
        table.integer('ownerId').default(null)
        table.string('name', 128).notNullable()
        table.jsonb('config').default({})
        table.boolean('complete').notNullable().default(false)
        table.boolean('successful').default(null)
        table.integer('currentStep').default(null)
        table.text('error').default(null)
        table.enum('status', ['INCOMPLETE', 'WAITING', 'SUCCEEDED', 'FAILED', 'CRASHED', 'ROLLEDBACK'], { useNative: true, enumName: 'process_status' }).notNullable().default('INCOMPLETE')
        table.datetime('created').defaultTo(knex.fn.now())

        table.index(['ownerId', 'created'])
    })

    await knex.schema.createTable('process_files', function (table) {
        table.increments('id')
        table.integer('processId').notNullable()
        table.foreign('processId').references('processes.id')
        table.text('name')
        table.string('type', 64)
        table.string('encoding', 16)
        table.text('data')

        table.index(['processId'])
    })

    await knex.schema.createTable('process_steps', function (table) {
        table.increments('id')

        table.integer('processId').notNullable()
        table.foreign('processId').references('processes.id')

        table.integer('number').notNullable()
        table.string('handler', 32).notNullable()
        table.jsonb('directions')
        table.jsonb('action').default(null)
        table.datetime('started').defaultTo(knex.fn.now())
        table.jsonb('state').notNullable()
        table.datetime('finished').default(null)

        table.unique(['processId', 'number'])
    })
}

async function down(knex) {
    await knex.schema.dropTable('process_files')
    await knex.schema.dropTable('process_steps')
    await knex.schema.dropTable('processes')
    await knex.schema.raw('DROP TYPE process_status')
}

module.exports = {
    up, down
}