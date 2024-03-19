import express from 'express'
import knex from '../lib/knex'
import catalog from '../lib/catalog'
import { getImportSystem } from '../lib/importing'
import { ImportPlugin, ProcessFileData } from '@tasenor/common-node'
import { ID, ImportRule, ProcessStatus, log, validFileName } from '@tasenor/common'
import deepEqual from 'fast-deep-equal'

const router = express.Router()

/**
 * Get all importers.
 */
router.get('/',
  async (req, res) => {
    const db = await knex.db(res.locals.user, res.locals.db)
    const importers = await db('importers').orderBy('id')
    res.send(importers)
  }
)

/**
 * Create new importer.
 */
router.post('/',
  async (req, res) => {
    const { name, config } = req.body
    if (!name) {
      return res.status(400).send({ message: 'Name is missing.' })
    }
    if (!validFileName(name)) {
      return res.status(400).send({ message: 'Invalid characters in the name.' })
    }
    if (!config || typeof config !== 'object') {
      return res.status(400).send({ message: 'Invalid configuration.' })
    }
    if (!config.handler) {
      return res.status(400).send({ message: 'Handler is missing.' })
    }

    const db = await knex.db(res.locals.user, res.locals.db)
    const existing = await db('importers').where({ name }).first()
    if (existing) {
      return res.status(400).send({ message: 'Importer with that name already exists.' })
    }

    const plugin: ImportPlugin = catalog.find(config.handler) as ImportPlugin
    if (!plugin) {
      return res.status(400).send({ message: 'Plugin not found.' })
    }

    config.handler = plugin.getHandler().name
    config.rules = config.rules || []
    config.version = plugin.version
    config.rules = config.rules.concat(plugin.getRules())
    const acc = await db('account').whereRaw(`data->>'plugin' = '${plugin.code}'`).andWhereRaw("data->>'code' = 'CASH'").first()
    config.cashAccount = acc ? acc.number : null

    const out = await db('importers').insert({ name, config }).returning('*')
    res.send(out[0])
  }
)

/**
 * Get one importer.
 */
router.get('/:id',
  async (req, res) => {
    const db = await knex.db(res.locals.user, res.locals.db)
    const importer = await db('importers').where({ id: parseInt(req.params.id) }).first()
    res.send(importer)
  }
)

/**
 * Update one importer.
 */
router.patch('/:id',
  async (req, res) => {
    const db = await knex.db(res.locals.user, res.locals.db)
    const id = parseInt(req.params.id)
    const update: Record<string, unknown> = {}
    const config = (await db('importers').select('config').where({ id }).first()).config
    if ('config' in req.body) {
      Object.assign(config, req.body.config)
      update.config = config
    }
    if ('name' in req.body) {
      update.name = req.body.name
    }
    if ('version' in req.body) {
      update.config = config;
      (update.config as Record<string, unknown>).version = req.body.version
    }
    await db('importers').update(update).where({ id })
    res.sendStatus(204)
  }
)

/**
 * Upgrade importer rules.
 */
router.put('/:id/upgrade',
  async (req, res) => {
    const db = await knex.db(res.locals.user, res.locals.db)
    const id = parseInt(req.params.id)
    const version = req.body.version
    const config = (await db('importers').select('config').where({ id }).first()).config
    const code = config.handler
    const plugin = catalog.find(code) as ImportPlugin
    if (!plugin) {
      return res.status(400).send({ message: 'Import plugin not found.' })
    }
    // TODO: Check subscription.
    if (plugin.version !== version) {
      return res.status(404).send({ message: 'Requested plugin version not found.' })
    }
    log(`Upgrading importer rules for importer ${id} using plugin '${code}'.`)

    for (const rule of plugin.getRules()) {
      const index = config.rules.findIndex(r => r.name === rule.name)
      if (index < 0) {
        log(`Adding new rule '${rule.name}' to the importer ${id}.`)
        config.rules.push(rule)
      } else {
        const defined = config.rules[index]
        if (!deepEqual(defined, rule)) {
          log(`Updating rule '${rule.name}' in the importer ${id}.`)
          config.rules[index] = rule
        }
      }
    }
    config.version = version
    await db('importers').update({ config }).where({ id })
    res.sendStatus(204)
  }
)

/**
 * Start import process using the specific importer.
 */
router.post('/:id',
  async (req, res) => {
    const { files, firstDate, lastDate }: { files: ProcessFileData[], firstDate: string, lastDate: string } = req.body
    const importerId = req.params.id
    const db = await knex.db(res.locals.user, res.locals.db)
    const importer = await db('importers').select('id', 'config').where({ id: importerId }).first()
    if (!importer) {
      return res.status(400).send({ message: 'Invalid importer ID.' })
    }
    if (!firstDate || !lastDate) {
      return res.status(400).send({ message: 'Please select the period before importing.' })
    }

    const system = await getImportSystem(db, parseInt(importerId))
    const config = { ...importer.config, firstDate, lastDate }

    const names = files.map(f => f.name)
    const process = await system.createProcess(`Uploading file(s) ${names}`, files, config)

    await db('processes').update({ ownerId: importerId }).where({ id: process.id })
    if (process.canRun()) {
      await process.run()
    }
    const result: {processId: ID, status: ProcessStatus, step?: number } = { processId: process.id, status: process.status, step: undefined }
    if (process.steps && process.steps.length) {
      result.step = process.steps.length - 1
    }
    res.send(result)
  }
)

export default router
