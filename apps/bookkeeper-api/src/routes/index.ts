import express from 'express'
import { tasenor } from '../lib/middleware'

import accountRoute from './account'
import authRoute from './auth'
import dbRoute from './db'
import documentRoute from './document'
import entryRoute from './entry'
import headingRoute from './heading'
import importerRoute from './importer'
import importRoute from './import'
import knowledgeRoute from './knowledge'
import languagesRoute from './languages'
import periodRoute from './period'
import pluginsRoute from './plugins'
import registerRoute from './register'
import reportRoute from './report'
import servicesRoute from './services'
import settingsRoute from './settings'
import statusRoute from './status'
import subscriptionsRoute from './subscriptions'
import systemRoute from './system'
import tagsRoute from './tags'
import toolsRoute from './tools'
import adminDbRoute from './admin-db'
import adminUserRoute from './admin-user'

const router = express.Router()

router.use('/admin/db', ...tasenor({ url: true, json: true }), adminDbRoute)
router.use('/admin/user', ...tasenor({ url: true, json: true }), adminUserRoute)
router.use('/auth', authRoute)
router.use('/db/:db/account', ...tasenor({ url: true, json: true, user: true, db: true }), accountRoute)
router.use('/db/:db/document', ...tasenor({ url: true, json: true, user: true, db: true }), documentRoute)
router.use('/db/:db/entry', ...tasenor({ url: true, json: true, user: true, db: true }), entryRoute)
router.use('/db/:db/heading', ...tasenor({ url: true, json: true, user: true, db: true }), headingRoute)
router.use('/db/:db/import', ...tasenor({ url: true, json: true, user: true, db: true }), importRoute)
router.use('/db/:db/importer', ...tasenor({ url: true, json: true, user: true, db: true, upload: true }), importerRoute)
router.use('/db/:db/period', ...tasenor({ url: true, json: true, user: true, db: true }), periodRoute)
router.use('/db/:db/report', ...tasenor({ url: true, json: true, user: true, db: true }), reportRoute)
router.use('/db/:db/services', ...tasenor({ url: true, json: true, user: true, db: true }), servicesRoute)
router.use('/db/:db/settings', ...tasenor({ url: true, json: true, user: true, db: true }), settingsRoute)
router.use('/db/:db/tags', ...tasenor({ user: true, db: true }), tagsRoute)
router.use('/db/:db/tools', ...tasenor({ user: true, db: true, json: true }), toolsRoute)
router.use('/knowledge', ...tasenor({ url: true, json: true }), knowledgeRoute)
router.use('/languages', ...tasenor({ url: true, json: true }), languagesRoute)
router.use('/plugins', ...tasenor({ json: true }), pluginsRoute)
router.use('/subscriptions', ...tasenor({ url: true, json: true, user: true }), subscriptionsRoute)
router.use('/register', ...tasenor({ url: true, json: true }), registerRoute)
router.use('/services', ...tasenor({ url: true, json: true, user: true, audience: ['bookkeeping', 'internal'] }), servicesRoute)
router.use('/status', statusRoute)
router.use('/system', ...tasenor({ url: true, json: true }), systemRoute)
router.use('/db', dbRoute)

export default router
