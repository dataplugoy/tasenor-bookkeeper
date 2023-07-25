/**
 * This should be really a Vite plugin, but since at the time of writing
 * Vite config together with Turborepo really sucks, it cannot be done.
 * No package from local can be really imported.
 */
import path from 'path'
import express from 'express'
import pkg from '../../package.json' assert { type: 'json' }
import { log } from '@dataplug/tasenor-common'

const app = express()

async function main() {
  log(`Starting plugin server v${pkg.version}`)

}

main().then(() => process.exit()).catch(err => { console.log(err); process.exit(-1) })
