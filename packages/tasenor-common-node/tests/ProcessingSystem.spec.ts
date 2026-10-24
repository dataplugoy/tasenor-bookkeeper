import { describe, expect, test } from '@jest/globals'
import { ProcessingSystem } from '../src/process/ProcessingSystem'
import { ProcessHandler } from '../src/process/ProcessHandler'

/**
 * A database recording the latest status written for each process.
 */
function makeDb() {
  const statuses: Record<number, string> = {}
  let nextId = 1
  const db = (table: string) => ({
    insert: (data: { status?: string }) => ({
      returning: async () => {
        const id = nextId++
        if (table === 'processes') statuses[id] = data.status as string
        return [{ id }]
      }
    }),
    update: (data: { status?: string }) => ({
      where: async ({ id }: { id: number }) => {
        if (table === 'processes' && data.status) statuses[id] = data.status
      }
    })
  })
  return { db, statuses }
}

const file = (name: string) => ({ name, type: 'text/csv', encoding: 'utf-8', data: 'a,b\n1,2\n' })

describe('ProcessingSystem', () => {

  test.each([
    ['init() fails', [file('a.csv')], { init: async () => { throw new Error('Unsupported version.') } }],
    ['canAppend() fails', [file('a.csv'), file('b.csv')], {}]
  ])('marks the process crashed when handler %s', async (_name, files, overrides) => {
    const { db, statuses } = makeDb()
    const failed: unknown[] = []
    const system = new ProcessingSystem(db as never, { fail: async (err: unknown) => { failed.push(err) } } as never)
    system.logger = { info: () => undefined, error: () => undefined }
    const handler = Object.assign(new ProcessHandler('Test'), { canHandle: () => true }, overrides)
    system.register(handler)

    const process = await system.createProcess('Test', files as never, {})

    expect(process.status).toBe('CRASHED')
    expect(statuses[process.id as number]).toBe('CRASHED')
    expect(failed.length).toBe(1)
  })
})
