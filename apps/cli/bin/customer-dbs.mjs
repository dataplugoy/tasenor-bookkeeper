#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { DB } = commonNode

const defaults = {
  SECRET: 'eb53dbcd0f081bfcec68bdf88dce90f2a1d26bd88be8ee49caea74920e35bb3e',
  VAULT_URL: 'env://',
  DATABASE_URL: 'postgresql://bookkeeper:Biure80s2rt832@localhost:7202/bookkeeper',
  DATABASE_ROOT_USER: 'root',
  DATABASE_ROOT_PASSWORD: 'Jow92eygdGYwe3edsoy2'
}

if (process.env.DATABASE_URL === 'postgresql://demo:oiuewHqw3d@localhost:7202/demo') {
  console.log('This command cannot be run to demo DB url. Please unset DATABASE_URL or set it to correct value.')
  process.exit(1)
}

Object.entries(defaults).forEach(([k, v]) => {
  if (process.env[k] === undefined) process.env[k] = v
})

DB.customerDbs(DB.envHost())
  .then((dbs) => {
    dbs.map(db => console.log(`postgresql://${db.user}:${db.password}@${db.host}:${db.port}/${db.database}`))
    process.exit()
  })
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })
