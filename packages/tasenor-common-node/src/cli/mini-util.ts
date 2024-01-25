import path from 'path'
import { ArgumentParser } from 'argparse'
import { cli } from './cli'
import { Crypto } from '@tasenor/common'

/**
 * This is a collection of minimal utils available for easy command-line use.
 *
 * Idea of this library is to provide shared commons for CLI tool funcitonality.
 * To add a tool to any related project, you can create `.mjs` file with the
 * similar content to the following:
 * ```
 *    #!/usr/bin/env -S npx tsx
 *    import commonNode from '@tasenor/common-node'
 *    commonNode.runMiniUtil('encrypt')
 * ```
 *
 * If the name of the file is the same than a function below, you can leave out the name, i.e
 * if the file above is `encrypt.mjs` it suffices to call `commonNode.runMiniUtil()`.
 */

export interface MiniUtil {
  title: string
  args: [string, Record<string, string>][]
  exe: (args: Record<string, any>) => Promise<void>
}

const utils: Record<string, MiniUtil> = {}

/**
 * Encrypt a string using the secret from argument, environment SECRET or queried from user.
 */
utils.encrypt = {
  title: 'Encrypt a string.',
  args: [
    ['text', { help: 'Target string to encrypt' }],
    ['secret', { help: 'Secret key. Defaults to SECRET environment. If not given, asks.', nargs: '?' }],
  ],
  exe: async ({ text, secret }) => {
    if (!secret) {
      secret = process.env.SECRET
    }
    if (!secret) {
      secret = await cli.ask('What is the secret string?')
    }
    const crypted = await Crypto.encrypt(secret, text)
    console.log(crypted)
  },
}

/**
 * Decrypt an encoded string using the secret from argument, environment SECRET or queried from user.
 */
utils.decrypt = {
  title: 'Decrypt a string.',
  args: [
    ['text', { help: 'Target string to decrypt' }],
    ['secret', { help: 'Secret key. Defaults to SECRET environment. If not given, asks.', nargs: '?' }],
  ],
  exe: async ({ text, secret }) => {
    if (!secret) {
      secret = process.env.SECRET
    }
    if (!secret) {
      secret = await cli.ask('What is the secret string?')
    }
    const decrypted = await Crypto.decrypt(secret, text)
    console.log(decrypted)
  },
}

/**
 * Runner for mini utils.
 */
export function runMiniUtil(name: string | undefined = undefined) {
  if (!name) {
    name = path.basename(process.argv[1], '.mjs')
  }
  if (!utils[name]) {
    throw new Error(`There is no mini util called '${name}'.`)
  }
  const parser: ArgumentParser = new ArgumentParser({
    description: utils.title
  })
  for (const arg of utils[name].args) {
    parser.add_argument(...arg)
  }
  const args = parser.parse_args(process.argv.slice(2))

  const callArgs: Record<string, any> = {}
  for (const [arg, ] of utils[name].args) {
    callArgs[arg] = args[arg]
  }

  utils[name].exe(callArgs).catch(err => {
    console.error(err)
    process.exit(-1)
  }).then(() => process.exit())
}
