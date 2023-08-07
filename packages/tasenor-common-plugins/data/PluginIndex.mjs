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
    txt += `export ${module}PluginBackend from './${module}/backend'\n`
  }
  if (fs.existsSync(path.join(pathName, 'backend', `${module.replace(/Import$/, '')}Handler.ts`))) {
    txt += `export ${module}Handler from './${module}/${module}Handler'\n`
  }
  if (fs.existsSync(path.join(pathName, 'ui'))) {
    txt += `export ${module}PluginUI from './${module}/ui'\n`
  }
}

const indexPath = path.join(dir, 'index.ts')
fs.writeFileSync(indexPath, txt)
console.log(new Date(), `Saved plugin index to ${indexPath}`)
