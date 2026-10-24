import { describe, expect, test } from '@jest/globals'
import { Directions, ProcessStatus } from '@tasenor/common'
import { Process } from '../src/process/Process'
import { ProcessStep } from '../src/process/ProcessStep'

describe('Process', () => {

  test('rollback leaves the process in rolled back state', async () => {
    // A database where the first process update completes last.
    const statuses: ProcessStatus[] = []
    let processUpdates = 0
    const db = (table: string) => ({
      update: (data: { status?: ProcessStatus }) => ({
        where: () => {
          const delay = table === 'processes' && processUpdates++ === 0 ? 30 : 0
          return new Promise<void>(resolve => setTimeout(() => {
            if (table === 'processes') statuses.push(data.status as ProcessStatus)
            resolve()
          }, delay))
        }
      })
    })
    const system = { db, handler: { rollback: async () => undefined }, logger: { info: () => undefined } }
    const process = new Process(system as never, 'Test')
    process.id = 1
    process.status = 'SUCCEEDED'
    for (const number of [0, 1]) {
      const step = new ProcessStep({ number, state: {}, handler: 'Test' } as never)
      step.id = number + 1
      process.addStep(step)
    }
    process.currentStep = 1

    expect(await process.rollback()).toBe(true)
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(process.status).toBe('ROLLEDBACK')
    expect(statuses[statuses.length - 1]).toBe('ROLLEDBACK')
  })

  test('waiting on the first step passes its state and directions to the connector', async () => {
    const db = () => ({ update: () => ({ where: async () => undefined }) })
    const waiting: unknown[][] = []
    const system = { db, logger: { info: () => undefined }, connector: { waiting: async (...args: unknown[]) => { waiting.push(args) } } }
    const process = new Process(system as never, 'Test')
    process.id = 1
    const step = new ProcessStep({ number: 0, state: { stage: 'initial' }, handler: 'Test' } as never)
    step.directions = new Directions({ type: 'ui', element: { type: 'text', name: 'answer.1.question' } as never })
    process.addStep(step)
    process.currentStep = 0

    await process.updateStatus()

    expect(process.status).toBe('WAITING')
    expect(waiting).toEqual([[{ stage: 'initial' }, step.directions]])
  })
})
