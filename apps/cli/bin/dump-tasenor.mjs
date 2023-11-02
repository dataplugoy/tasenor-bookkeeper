#!/usr/bin/env -S npx tsx
/**
 * Create tar-package from bookkeeper database.
 */
import fs from 'fs'
import common from '@tasenor/common'
import commonNode from '@tasenor/common-node'

const { TasenorExporter } = commonNode
const { error } = common

function usage() {
  console.log(`${process.argv[1]} <database-url> [<tar-file-path>]`)
}

async function main(url, tmpDir, tarName) {
  const exporter = new TasenorExporter()
  await exporter.run(url, tmpDir, tarName)
}

if (process.argv.length < 3) {
  usage()
} else {
  const out = fs.mkdtempSync('/tmp/tasenor-export-')
  main(process.argv[2], out, process.argv[3])
    .then(() => process.exit())
    .catch(err => { error(err); process.exit(1) })
}
