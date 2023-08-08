import { error, ID, ImportAction, isRuleEditorElement, ProcessStatus } from '@tasenor/common'
import express from 'express'
import { getImportSystem } from '../lib/importing'
import knex from '../lib/knex'
import clone from 'clone'
import { isProduction } from '@tasenor/common-node'
import { suspenseAccount } from '../lib/account'
import { getSetting } from '../lib/settings'

const router = express.Router()

/**
 * Get all processes created by an importer.
 */
router.get('/:id',
  async (req, res) => {
    const ownerId = req.params.id
    const db = await knex.db(res.locals.user, res.locals.db)
    const processes = await db('processes').select('*').where({ ownerId }).orderBy('created', 'desc')
    if (isProduction() && !res.locals.auth.feats.SUPERUSER) {
      processes.forEach(p => {
        if (p.error) {
          p.error = p.error.split('\n')[0]
        }
      })
    }

    res.send(processes)
  }
)

/**
 * Get the process with basic information of steps.
 */
router.get('/:id/process/:processId',
  async (req, res) => {
    const processId = parseInt(req.params.processId)
    if (!processId) {
      return res.status(400).send({ message: 'Invalid process ID.' })
    }
    const db = await knex.db(res.locals.user, res.locals.db)
    const data = await db('processes').select('*').where({ id: processId }).first()
    // Hide stack.
    if (isProduction() && !res.locals.auth.feats.SUPERUSER) {
      if (data.error) {
        data.error = data.error.split('\n')[0]
      }
    }
    if (data) {
      const steps = await db('process_steps').select('id', 'action', 'directions', 'number', 'started', 'finished').where({ processId }).orderBy('number')
      data.steps = steps || []
    }
    res.send(data)
  }
)

/**
 * Receive new configuration settings or UI query answers and continue processing.
 */
router.post('/:id/process/:processId',
  async (req, res) => {
    let keepRepeating = false
    const processId = parseInt(req.params.processId)
    if (!processId) {
      return res.status(400).send({ message: 'Invalid process ID.' })
    }
    const db = await knex.db(res.locals.user, res.locals.db)
    const processData = await db('processes').select('ownerId', 'config').where({ id: processId }).first()
    if (!processData) {
      return res.status(404).send({ message: 'Process not found.' })
    }

    const system = await getImportSystem(db, processData.ownerId)

    // Remove internal UI variables not needed in process.
    delete req.body.grouping

    const process = await system.loadProcess(processId)
    let input: ImportAction | undefined

    // Simply retry. Useful onlyt after code changes.
    if (req.body.continueOption === 'retry') {
      input = {
        retry: true
      }

    // Skip the current transaction.
    } else if (req.body.continueOption === 'skip-one' || req.body.continueOption === 'ignore-rest-unrecognized') {
      keepRepeating = req.body.continueOption === 'ignore-rest-unrecognized'
      const { segment } = req.body.once
      input = {
        answer: {
          [segment]: {
            skip: true
          }
        }
      }
    } else if (req.body.continueOption === 'suspense-unrecognized') {

      const { segment, transfers } = req.body.once
      const suspense = await suspenseAccount(db)

      if (!suspense) {
        const scheme = await getSetting(db, 'scheme')
        const version = await getSetting(db, 'schemeVersion')
        error(`The schema '${scheme}' version ${version} does not have suspense account defined.`)
        return res.status(400).send({ message: 'The schema does not have suspense account defined.' })
      }

      transfers.push({
        reason: 'expense',
        type: 'account',
        asset: suspense.number,
        amount: -transfers[0].amount
      })

      input = {
        answer: {
          [segment]: {
            transfers
          }
        }
      }
      // If configuring or answering a question, put to config in place and rerun.
    } else if ('configure' in req.body || 'answer' in req.body) {
      if ('configure' in req.body) {
        const importer = await db('importers').select('config').where({ id: processData.ownerId }).first()
        Object.assign(importer.config, clone(req.body.configure))
        // Do not save answers to importer if they slip here. They belong to process only.
        delete importer.config.answers
        await db('importers').update({ config: importer.config }).where({ id: processData.ownerId })
      }
      input = req.body

    // If running `once`, set the transfers directly as an answer.
    } else if ('once' in req.body) {
      const { segment, transfers } = req.body.once

      input = {
        answer: {
          [segment]: {
            transfers
          }
        }
      }
    } else {
      error(`Invalid input for a process #${processId}: ${JSON.stringify(req.body)}`)
      return res.status(400).send({ message: 'Invalid input for a process.' })
    }

    // Process the input and reply the response.
    while (true && input) {

      await process.input(input)
      if (process.canRun()) {
        await process.run()
      }

      // If repeat allowed and waiting for rule editor, skip it automatically.
      input = undefined
      if (keepRepeating && process.status === 'WAITING' && process.currentStep) {
        const { directions } = process.steps[process.currentStep]
        if (directions && directions.type === 'ui' && isRuleEditorElement(directions.element)) {
          const segmentId = directions.element.lines[0].segmentId
          if (!segmentId) throw new Error(`Failed to find segment ID from ${JSON.stringify(directions.element)}.`)
          input = {
            answer: {
              [segmentId]: {
                skip: true
              }
            }
          }
        }
      }

      if (!input) break
    }

    const result: {processId: ID, status: ProcessStatus, step?: number } = { processId, status: process.status, step: undefined }

    if (process.steps && process.steps.length) {
      result.step = process.steps.length - 1
    }

    res.send(result)
  }
)

/**
 * Get the process step data.
 */
router.get('/:id/process/:processId/step/:number',
  async (req, res) => {
    const processId = parseInt(req.params.processId)
    const number = parseInt(req.params.number)
    if (isNaN(number)) {
      error(`Invalud step number ${JSON.stringify(req.params.number)}`)
      return res.status(400).send({ message: 'Invalid step number.' })
    }
    const db = await knex.db(res.locals.user, res.locals.db)
    const data = await db('process_steps').select('*').where({ processId, number }).first()
    return res.send(data)
  }
)

/**
 * Create new rule for the importer and continue classification.
 */
router.post('/:id/process/:processId/rule',
  async (req, res) => {
    // Validate and update importer rules.
    const importerId = parseInt(req.params.id)
    const processId = parseInt(req.params.processId)
    const db = await knex.db(res.locals.user, res.locals.db)
    const importer = await db('importers').select('id', 'config').where({ id: importerId }).first()
    if (!importer) {
      return res.status(404).send({ message: 'Importer not found.' })
    }
    if (!req.body.once || !req.body.once.rule) {
      return res.status(400).send({ message: 'Rule not given in the request.' })
    }
    importer.config.rules.push(req.body.once.rule)
    await db('importers').update(importer).where({ id: importerId })

    // Try to continue with new rules.
    const system = await getImportSystem(db, importerId)
    const process = await system.loadProcess(processId)
    await process.input({ configure: { rules: importer.config.rules } })
    if (process.canRun()) {
      await process.run()
    }
    await process.input({ op: 'classification' })
    if (process.canRun()) {
      await process.run()
    }

    // Get the next step.
    const steps = await db('process_steps').count('*').where({ processId })
    const result = { processId, status: 'SUCCESS', step: parseInt(`${steps[0].count}`) - 1 }

    return res.send(result)
  }
)

/**
 * Remove results from the database created by import.
 */
router.post('/:id/process/:processId/rollback',
  async (req, res) => {
    // Validate and update importer rules.
    const importerId = parseInt(req.params.id)
    const processId = parseInt(req.params.processId)
    const db = await knex.db(res.locals.user, res.locals.db)
    const importer = await db('importers').select('id', 'config').where({ id: importerId }).first()
    if (!importer) {
      return res.status(404).send({ message: 'Importer not found.' })
    }

    // Try to continue with new rules.
    const system = await getImportSystem(db, importerId)
    const process = await system.loadProcess(processId)
    if (process.status !== 'SUCCEEDED') {
      return res.status(400).send({ message: 'Process must be succeeded state in order to rollback.' })
    }

    if (!await process.rollback()) {
      return res.status(400).send({ message: 'Process rollback failed.' })
    }

    return res.status(204).send()
  }
)

export default router
