import fs from 'fs'
import path from 'path'
import express from 'express'
import multer from 'multer'
import knex from '../lib/knex'
import { DB, BookkeeperImporter, TasenorExporter } from '@tasenor/common-node'
import catalog from '../lib/catalog'
import { log, error, DatabaseName, Hostname, DirectoryPath, FilePath, TsvFilePath } from '@tasenor/common'
import { createNewDatabase, initializeNewDatabase, initializeSettings } from '../lib/db'
import { tasenor } from '../lib/middleware'
import { checkSubscription } from '../lib/subscriptions'

const router = express.Router()

const DB_REGEX = /^[0-9a-z-_]+$/

router.get('/',
  ...tasenor({ json: true, user: true }),
  async (req, res) => {
    const dbs = await knex.dbs(res.locals.user)
    res.send(dbs.map(db => {
      return { name: db }
    }))
  })

router.post('/',
  ...tasenor({ json: true, user: true }),
  async (req, res, next) => {
    const { scheme, databaseName, companyName, companyCode, settings } = req.body

    if (!scheme) {
      error('Scheme not given.')
      return res.status(400).send({ message: 'Scheme is required.' })
    }
    const schemePlugin = catalog.getSchemePlugin(scheme)

    if (!schemePlugin) {
      error(`Cannot find the scheme plugin for scheme ${scheme}.`)
      return res.status(400).send({ message: 'Cannot find the scheme plugin.' })
    }

    const failed = checkSubscription(res, schemePlugin.code)
    if (failed) {
      return failed
    }

    if (!DB_REGEX.test(databaseName)) {
      error(`Invalid database name ${databaseName}.`)
      return res.status(400).send({ message: 'Invalid database name.' })
    }

    const masterDb = knex.masterDb()
    let exists
    try {
      exists = await DB.exists(masterDb, databaseName)
    } catch (err) {
      return next(err)
    }
    if (exists) {
      error(`Database ${databaseName} exists.`)
      return res.status(400).send({ message: 'Database already exists.' })
    }

    if (!settings.language) {
      settings.language = schemePlugin.supportedLanguages()[0]
    }
    if (!settings.currency) {
      settings.currency = schemePlugin.supportedCurrencies()[0]
    }
    if (!schemePlugin.supportedLanguages().includes(settings.language)) {
      return res.status(400).send({ message: 'The language is not supported by the scheme.' })
    }
    if (!schemePlugin.supportedCurrencies().includes(settings.currency)) {
      return res.status(400).send({ message: 'The currency is not supported by the scheme.' })
    }

    const schemePaths: TsvFilePath[] | null = catalog.getSchemePaths(scheme, settings.language)
    if (!schemePaths) {
      error(`Scheme '${scheme}' not supported.`)
      return res.status(400).send({ message: 'Scheme not supported.' })
    }

    const config = {
      ...catalog.getSchemeDefaults(scheme),
      companyName,
      companyCode,
      scheme,
      schemeVersion: schemePlugin.version
    }

    if (!await createNewDatabase(databaseName, res.locals.user, config)) {
      return res.status(400).send({ message: 'Creating database failed.' })
    }
    await initializeNewDatabase(databaseName, res.locals.user, schemePaths)
    await initializeSettings(databaseName, res.locals.user, settings)

    res.sendStatus(204)
  }
)

router.delete('/:name',
  ...tasenor({ json: true, user: true }),
  async (req, res) => {
    const { name } = req.params
    if (!DB.isValidName(name)) {
      error(`Invalid database name ${name}.`)
      return res.status(400).send({ message: 'Invalid database name.' })
    }
    if (!await knex.isDb(res.locals.user, name)) {
      return res.status(404).send({ message: 'No such database.' })
    }
    const masterDb = knex.masterDb()
    const conf = await knex.dbSettings(res.locals.user, name)
    if (!conf || !conf.isCreator) {
      return res.status(403).send({ message: 'You are not allowed to delete this database.' })
    }
    const message = await DB.destroy(masterDb, name as DatabaseName, process.env.DB_HOST_OVERRIDE as Hostname)
    if (message === null) {
      return res.sendStatus(204)
    }
    return res.status(400).send({ message })
  }
)

router.post('/upload',
  ...tasenor({ url: true, user: true, upload: true }),
  async (req, res) => {
    const PATH = fs.mkdtempSync('/tmp/bookkeeper-upload-')
    const out = fs.mkdtempSync('/tmp/bookkeeper-upload-extract-')
    const upload = multer({ dest: PATH })
    upload.single('file')(req, res, async function (err) {
      try {
        if (err) {
          log(err)
          res.sendStatus(500)
        } else if (!req.file || !req.file.originalname) {
          res.status(400).send({ message: 'File missing.' })
        } else {
          // Name the database by the leading letters of the file name, if there are any.
          const nameMatch = /^([A-Za-z]+)/.exec(req.file.originalname)
          let dbName = nameMatch ? nameMatch[1].toLowerCase() : 'unknown'
          const masterDb = knex.masterDb()
          dbName = await DB.findName(masterDb, dbName)
          if (!await createNewDatabase(dbName, res.locals.user, { isCreator: true })) {
            return res.status(400).send({ message: 'Creating database failed.' })
          }
          const importer = new BookkeeperImporter()
          try {
            await importer.run(masterDb, dbName, req.file.path as FilePath, out as DirectoryPath)
          } catch (importErr) {
            error(`Importing ${req.file.originalname} failed:`, importErr)
            await DB.destroy(masterDb, dbName as DatabaseName, process.env.DB_HOST_OVERRIDE as Hostname).catch(destroyErr => error(destroyErr))
            return res.status(400).send({ message: 'Importing the file failed.' })
          }
          res.sendStatus(204)
        }
      } catch (unexpected) {
        error(unexpected)
        if (!res.headersSent) {
          res.sendStatus(500)
        }
      } finally {
        fs.rmSync(PATH, { recursive: true, force: true })
        fs.rmSync(out, { recursive: true, force: true })
      }
    })
  }
)

router.get('/:name/download',
  ...tasenor({ url: true, user: true, upload: true }),
  async (req, res) => {
    let db
    try {
      db = await knex.db(res.locals.user, req.params.name)
    } catch (err) {
      error(err)
      return res.status(404).send({ message: 'No such database.' })
    }
    const outDir: DirectoryPath = fs.mkdtempSync('/tmp/bookkeeper-download-') as DirectoryPath
    const exporter = new TasenorExporter()
    let tarPath
    try {
      tarPath = await exporter.runDb(db, outDir)
    } catch (err) {
      error(err)
      fs.rmSync(outDir, { recursive: true, force: true })
      return res.status(500).send({ message: 'Creating the backup failed.' })
    }
    res.sendFile(tarPath, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${path.basename(tarPath)}"`,
        'Access-Control-Expose-Headers': 'Content-Disposition'
      }
    }, function(err) {
      if (err) error(err)
      // The backup is created only for this download, so do not leave it on the server.
      fs.rmSync(tarPath, { force: true })
    })
  }
)

export default router
