import { describe, expect, test } from '@jest/globals'
import { ImportSegment, ProcessConfig, TextFileLine } from '@tasenor/common'
import { TransactionImportHandler } from '../src/import/TransactionImportHandler'

describe('TransactionRules', () => {

  test('forming tags from object', async () => {
    const now = new Date()
    const handler = new TransactionImportHandler('Test')

    const lines: TextFileLine[] = [
      {
        line: 0,
        text: 'ABC',
        columns: {
          val: 'A'
        }
      }
    ]

    const segment: ImportSegment = {
      id: 'ABCDE',
      time: now,
      lines: [
        {
          file: 'test.csv',
          number: 0
        }
      ]
    }

    const config: ProcessConfig = {
      currency: 'USD',
      rules: [
        {
          name: 'Tag test',
          filter: 'true',
          result: [
            {
              reason: "'transfer'",
              type: "'currency'",
              asset: 'config.currency',
              amount: '12',
              tags: {
                YES: 'true',
                NO: 'false',
                A: 'val=="A"',
                B: 'val=="B"'
              }
            }
          ]
        }
      ]
    }

    const result = await handler.classifyLines(lines, config, segment)

    expect(result).toStrictEqual({
      type: 'transfers',
      transfers: [
        {
          reason: 'transfer',
          type: 'currency',
          asset: 'USD',
          amount: 12,
          tags: ['A', 'YES']
        }
      ]
    })

  })

  test('conditional results', async () => {
    const handler = new TransactionImportHandler('Test')

    const lines: TextFileLine[] = [
      {
        line: 0,
        text: 'ABC',
        columns: {
          fee: '0'
        }
      }
    ]

    const segment: ImportSegment = {
      id: 'ABCDE',
      time: new Date(),
      lines: [
        {
          file: 'test.csv',
          number: 0
        }
      ]
    }

    const transfer = (amount: string, cond: string) => ({
      reason: "'transfer'",
      type: "'currency'",
      asset: 'config.currency',
      amount,
      if: cond
    })

    const config: ProcessConfig = {
      currency: 'USD',
      rules: [
        {
          name: 'Condition test',
          filter: 'true',
          result: [
            transfer('1', 'true'),
            transfer('2', 'false'),
            transfer('3', "$('missing', null)"),
            transfer('4', 'fee'),
            transfer('5', 'num(fee) == 0')
          ]
        }
      ]
    }

    const result = await handler.classifyLines(lines, config, segment)

    expect(result.transfers.map(t => t.amount)).toStrictEqual([1, 5])
  })

})
