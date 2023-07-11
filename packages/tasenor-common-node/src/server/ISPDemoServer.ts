import path from 'path'
import express from 'express'
import { Server } from 'http'
import fs from 'fs'
import Knex from 'knex'
import cors from 'cors'
import { router } from './router'
import { ID } from '@dataplug/tasenor-common'
import { ProcessHandler, ProcessConnector, defaultConnector, ProcessingSystem } from '../process'
import { KnexDatabase } from '../database'

/**
 * Simple demo server for one or more handler.
 *
 * Usage:
 * ```
 *  const handler1 = new MyCustomHandler('Custom 1')
 *  const handler2 = new MyCustomHandler('Custom 2')
 *  const server = new ISPDemoServer(PORT, DATABASE_URL, [handler1, handler2])
 *  server.start()
 * ```
 */
export class ISPDemoServer {
  private app = express()
  private server: Server
  private port: number
  private db: KnexDatabase
  private handlers: ProcessHandler[]
  private connector: ProcessConnector
  private configDefaults: Record<string, unknown>

  /**
   * Prepare settings.
   *
   * @param port
   * @param databaseUrl
   * @param handlers
   * @param connector
   */
  constructor(port: number, databaseUrl: string, handlers: ProcessHandler[], connector: ProcessConnector|null = null, configDefaults: Record<string, unknown> = {}) {
    this.port = port
    this.configDefaults = configDefaults
    let migrationsPath = path.normalize(path.join(__dirname, '/migrations/01_init.js'))
    if (!fs.existsSync(migrationsPath)) {
      migrationsPath = path.normalize(path.join(__dirname, '../../dist/migrations/01_init.js'))
    }
    if (!fs.existsSync(migrationsPath)) {
      migrationsPath = path.normalize(path.join(__dirname, '../../../dist/migrations/01_init.js'))
    }
    if (!fs.existsSync(migrationsPath)) {
      console.log(__dirname)
      throw new Error(`Cannot find migrations file '${migrationsPath}'.`)
    }
    this.db = Knex({
      client: 'pg',
      connection: databaseUrl,
      migrations: {
        directory: path.dirname(migrationsPath)
      }
    })
    this.handlers = handlers
    if (connector) {
      this.connector = connector
    } else {
      this.connector = defaultConnector
    }
  }

  /**
   * Launch the demo server.
   *
   * @param reset If set, reset the database on boot.
   */
  public start = async (reset = false): Promise<void> => {

    if (reset) {
      await this.db.migrate.rollback()
    }
    await this.db.migrate.latest()

    const systemCreator = () => {
      const system = new ProcessingSystem(this.db, this.connector)
      this.handlers.forEach(handler => system.register(handler))
      return system
    }

    this.app.use((req, res, next) => { res.locals.server = this; next() })
    this.app.use((req, res, next) => { console.log(new Date(), req.method, req.url); next() })
    this.app.use(cors())
    this.app.use(express.json({ limit: '1024MB' }))
    this.app.use('/api/isp', router(this.db, systemCreator))

    this.server = this.app.listen(this.port, () => {
      console.log(new Date(), `Server started on port ${this.port}.`)
      this.connector.initialize(this)
    })

    this.server.on('error', (msg) => {
      console.error(new Date(), msg)
    })
  }

  /**
   * Exit the server. If an error is given, raise also that error.
   * @param err
   */
  public stop = async (err: Error | undefined = undefined): Promise<void> => {
    console.log(new Date(), 'Stopping the server.')
    await this.server.close(() => {
      if (err) {
        throw err
      } else {
        process.exit()
      }
    })
  }

  async lastProcessID(): Promise<ID> {
    const ids = await this.db('processes').max('id').first()
    return ids ? ids.max : null
  }
}
