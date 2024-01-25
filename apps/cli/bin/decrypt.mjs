#!/usr/bin/env -S npx tsx
/**
 * Decrypt a string using the secret from argument, environment SECRET or queried from user.
 */

import common from '@tasenor/common'
const { Crypto } = common
import commonNode from '@tasenor/common-node'
const { cli } = commonNode

function usage() {
  console.log(`${process.argv[1]} <string> [<secret>]`)
}

async function main(value, secret) {
  if (!secret) {
    secret = await cli.ask('What is the secret string?')
  }
  const decrypted = await Crypto.decrypt(secret, value)
  console.log(decrypted)
}

if (process.argv.length < 3) {
  usage()
} else {
  main(process.argv[2], process.argv[3] || process.env.SECRET)
    .then(() => process.exit())
    .catch(err => { console.error(err); process.exit() })
}
