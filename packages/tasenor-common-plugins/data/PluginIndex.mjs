#!/usr/bin/env node
import glob from 'glob'
import fs from 'fs'
import path from 'path'
import * as url from 'url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const dir = path.join(__dirname, '..', 'src')

let txt = ''
for (const pathName of glob.sync(dir + '/*')) {
  const module = path.basename(pathName)
  if (fs.existsSync(path.join(pathName, 'backend'))) {
    txt += `export { default as ${module}Backend } from './${module}/backend'\n`
  }
  if (fs.existsSync(path.join(pathName, 'backend', `${module.replace(/Import$/, '')}Handler.ts`))) {
    txt += `export { ${module.replace(/Import$/, '')}Handler } from './${module}/backend/${module.replace(/Import$/, '')}Handler'\n`
  }
  // TODO: Currently tasenor-testing package does not compile tests, if this is included.
  // if (fs.existsSync(path.join(pathName, 'ui'))) {
  //   txt += `export { default as ${module}UI } from './${module}/ui'\n`
  // }
}

const indexPath = path.join(dir, 'index.ts')
fs.writeFileSync(indexPath, txt)
console.log(new Date(), `Saved plugin index to ${indexPath}`)
