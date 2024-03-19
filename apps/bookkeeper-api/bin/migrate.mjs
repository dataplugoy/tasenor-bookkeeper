#!/usr/bin/env -S npx tsx
import db from '../src/lib/db'
import commonNode from '@tasenor/common-node'

await commonNode.vault.initialize()
await db.default.migrate()
process.exit()
