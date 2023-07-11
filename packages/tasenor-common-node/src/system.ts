/**
 * Server operating system related functions.
 *
 * @module tasenor-common-node/src/system
 */
import { exec, spawn } from 'child_process'
import { log, error, note } from '@dataplug/tasenor-common'

/**
 * Helper to execute system command as a promise.
 * @param command A command.
 * @param quiet If set, do not output.
 * @returns Srandard output if successfully executed.
 */
export async function system(command: string, quiet = false): Promise<string> {
  if (!quiet) {
    log(`Running system command: ${command}`)
  }
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 500 }, (err, stdout, stderr) => {
      if (err) {
        if (!quiet) error(err)
        return reject(err)
      }
      if (stderr && !quiet) {
        note(`${stderr}`)
      }
      if (stdout && !quiet) {
        log(`${stdout}`)
      }
      resolve(stdout)
    })
  })
}

/**
 * A system call showing real time output of stdout.
 * @param command
 * @param quiet
 * @returns
 */
export async function systemPiped(command: string, quiet = false, ignoreError = false): Promise<string | null> {
  if (!quiet) {
    log(`Running system command: ${command}`)
  }
  return new Promise((resolve, reject) => {
    let out = ''
    const proc = spawn(command, { shell: true })
    proc.stdout.on('data', (data) => {
      out += data
      if (!quiet) process.stdout.write(data)
    })

    proc.stderr.on('data', (data) => {
      if (!quiet) process.stderr.write(data)
    })

    proc.on('close', (code) => {
      if (code) {
        if (ignoreError) {
          resolve(null)
        } else {
          reject(new Error(`Call '${command}' failed with code ${code}.`))
        }
      } else {
        resolve(out)
      }
    })
  })
}

/**
 * Check if the current environment is not development environment.
 */
export function isProduction(): boolean {
  return !isDevelopment()
}

/**
 * Check and return the operating environment.
 * @returns
 */
export function nodeEnv() {
  const env = process.env.NODE_ENV || 'production'
  if (!['development', 'staging', 'production'].includes(env)) {
    throw new Error(`Invalid NODE_ENV ${env}.`)
  }
  return env
}

/**
 * Check if the current environment is development environment.
 */
export function isDevelopment(): boolean {
  return nodeEnv() === 'development'
}
