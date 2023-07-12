import { Language, PK, ReportQueryParams, ReportID, ReportOptions, error, warning } from '@dataplug/tasenor-common'
import express from 'express'
import knex from '../lib/knex'
import catalog from '../lib/catalog'
import { KnexDatabase } from '@dataplug/tasenor-common-node'
import { AccountReport } from '../lib/AccountReport'

const router = express.Router()

/**
 * Get a list of available report option specifications.
 */
router.get('/',
  async (req, res) => {
    const db: KnexDatabase = await knex.db(res.locals.user, res.locals.db)
    const scheme = await db('settings').select('value').where({ name: 'scheme' }).pluck('value')
    const options: ReportOptions = {}
    for (const id of Array.from(await catalog.getReportIDs(scheme.length ? scheme[0] : undefined))) {
      options[id as string] = catalog.getReportOptions(id)
    }
    res.send({ options })
  }
)

router.get('/:format/:period',
  async (req, res) => {
    const format = req.params.format as ReportID
    const periodId: PK = parseInt(req.params.period) as PK
    const plugin = catalog.getReportPlgugin(format)
    if (!plugin) {
      return res.status(404).send({ message: 'No such report format.' })
    }

    const languages = plugin.getLanguages()
    if (languages.length === 0) {
      error(`A plugin ${plugin.code} does not support any language.`)
      return res.status(404).send({ message: 'No such report format.' })
    }

    const params: ReportQueryParams = {
      periodId,
      lang: (req.query.lang || 'en') as Language,
      quarter1: req.query.quarter1 === 'true',
      quarter2: req.query.quarter2 === 'true',
      quarter3: req.query.quarter3 === 'true',
      byTags: req.query.byTags === 'true',
      compact: req.query.compact === 'true',
      csv: 'csv' in req.query
    }

    if (!languages.includes(params.lang)) {
      warning(`Request for language '${params.lang}' for report '${plugin.code}', which is not supported.`)
      params.lang = 'en'
    }
    if (!languages.includes(params.lang)) {
      warning(`Request for language '${params.lang}' for report '${plugin.code}', which is not supported.`)
      params.lang = languages[0]
    }

    const db: KnexDatabase = await knex.db(res.locals.user, res.locals.db)
    const data = await plugin.renderReport(db, format, params)

    if (params.csv) {
      res.setHeader('Content-Disposition', `attachment; filename=${format}.csv`)
      res.setHeader('Content-Type', 'application/csv')
    }

    return res.send(data)
  })

router.get('/:format/:period/:account',
  async (req, res) => {
    const format = req.params.format as ReportID
    const periodId: PK = parseInt(req.params.period) as PK
    const accountId: PK = parseInt(req.params.account) as PK
    const params: ReportQueryParams = {
      accountId,
      periodId,
      dropTitle: true,
      lang: (req.query.lang || 'en') as Language,
      csv: 'csv' in req.query
    }
    const db: KnexDatabase = await knex.db(res.locals.user, res.locals.db)
    const plugin = new AccountReport()
    const data = await plugin.renderReport(db, format, params)

    if (params.csv) {
      res.setHeader('Content-Disposition', `attachment; filename=${format}.csv`)
      res.setHeader('Content-Type', 'application/csv')
    }

    return res.send(data)
  }
)

export default router
