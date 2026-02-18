#!/usr/bin/env -S npx tsx
const fs = require('fs')
const { TilitinExporter } = require('@tasenor/common-node')
const { error } = require('@tasenor/common')

function usage() {
  console.log(`${process.argv[1]} <sqlite-file> [<tar-file-path>]`)
}

async function main(sqliteFile, tmpDir, tarName) {
  const exporter = new TilitinExporter()
  await exporter.run(sqliteFile, tmpDir, tarName)
}

if (process.argv.length < 3) {
  usage()
} else {
  const out = fs.mkdtempSync('/tmp/tasenor-export-legacy-')
  main(process.argv[2], out, process.argv[3])
    .then(() => process.exit())
    .catch(err => { error(err); process.exit(1) })
}
