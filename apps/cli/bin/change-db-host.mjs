#!/usr/bin/env -S npx tsx
/**
 * Change the database host in the dump of the main `tasenor` database.
 *
 * This can be used when main database is moved to different host.
 */
import fs from 'fs'
import { argv } from 'process'

if (argv.length < 4) {
  console.log('usage: change-db-host.mjs <sql-file> <new-host-name>')
  process.exit(1)
}

const sql = fs.readFileSync(argv[2]).toString('utf-8')
const re=/^([0-9]+)\t([a-z0-9]+)\t([-a-z.]+)\t(7202)\t(user[0-9a-f]{20})\t(.*)$/
const replace = argv[3]

sql.split('\n').map(line => {
  if (re.test(line)) {
    const [_, id, db, _host, port, user, rest] = re.exec(line)
    console.log(`${id}\t${db}\t${replace}\t${port}\t${user}\t${rest}`)
  } else {
    console.log(line)
  }
})
