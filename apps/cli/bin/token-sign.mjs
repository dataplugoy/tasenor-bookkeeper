#!/usr/bin/env -S npx tsx
/**
 * Create signed token for Tasenor.
 */
import commonNode from '@tasenor/common-node'
const { vault, tokens, cli } = commonNode

if (!process.env.VAULT_URL) {
  process.env.VAULT_URL = 'env://'
}

function usage() {
  console.log(`${process.argv[1]} [--years=<n>] [refresh] <owner> <audience> [superuser|admin]`)
}

const YEAR = 60 * 60 * 24 * 365
let years = 1

async function main(type, owner, audience, feat) {
  const plugins = []
  let secret = process.env.SECRET
  if (!secret) {
    secret = await cli.ask('What is the secret string?')
    process.env.SECRET = secret
  }
  await vault.initialize()
  if (type === 'refresh') {
    const unsigned = {
      audience,
      owner,
      feats: {}
    }
    if (feat === 'admin') {
      unsigned.feats.ADMIN = true
    }
    if (feat === 'superuser') {
      unsigned.feats.SUPERUSER = true
    }
    if (plugins.length) {
      unsigned.plugins = plugins
    }
    const signed = await tokens.sign(unsigned, 'refresh', years * YEAR)
    console.log(signed)
    cli.exit()
  } else if (type === 'normal') {
    const unsigned = {
      owner,
      feats: {}
    }
    if (feat === 'admin') {
      unsigned.feats.ADMIN = true
    }
    if (feat === 'superuser') {
      unsigned.feats.SUPERUSER = true
    }
    const signed = await tokens.sign(unsigned, audience, years * YEAR)
    console.log(signed)
    cli.exit()
  } else {
    throw new Error(`Token type ${type} not supported.`)
  }
}

if (process.argv.length < 4) {
  usage()
} else {
  const args = process.argv.slice(2)
  if (/^--years=-?\d+$/.test(args[0])) {
    years = parseInt(args[0].substr(8))
    args.splice(0, 1)
  }
  if (args[0] !== 'refresh') {
    args.splice(0, 0, 'normal')
  }
  main(args[0], args[1], args[2], args[3])
    .then(() => process.exit())
    .catch(err => { console.error(err); process.exit() })
}
