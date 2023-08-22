#!/usr/bin/env -S npx tsx
import commonNode from '@tasenor/common-node'
const { tokens } = commonNode

function usage() {
  console.log(`${process.argv[1]} <token>`)
}

async function main(token) {
  const parsed = tokens.parse(token)
  if (parsed && parsed.payload && parsed.payload.iat) parsed.payload.iat = new Date(parsed.payload.iat * 1000)
  if (parsed && parsed.payload && parsed.payload.exp) parsed.payload.exp = new Date(parsed.payload.exp * 1000)
  console.dir(parsed, { depth: null })
}

if (process.argv.length < 3) {
  usage()
} else {
  main(process.argv[2])
    .then(() => process.exit())
    .catch(err => { console.error(err); process.exit() })
}
