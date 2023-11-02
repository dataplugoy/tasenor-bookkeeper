#!/usr/bin/env -S npx tsx
/**
 * A front end executor to tasenor CLI commands.
 */
import commonNode from '@tasenor/common-node'
const { CLI } = commonNode
const cli = new CLI()

const DEFAULTS = [
  { name: 'user', envName: 'USERNAME', defaultValue: 'root@localhost' },
  { name: 'password', envName: 'PASSWORD', defaultValue: 'Ayfiewchg872rt5sq2e4' },
  { name: 'api', envName: 'API', defaultValue: 'http://localhost:7205' },
  { name: 'ui_api', envName: 'UI_API', defaultValue: 'http://localhost:7204' }
]

cli.run(DEFAULTS).catch(err => { console.error('tasenor-cli:', err); process.exit(-1) }).then(() => process.exit())
