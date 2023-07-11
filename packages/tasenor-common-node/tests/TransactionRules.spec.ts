import { ImportSegment, ProcessConfig, TextFileLine } from '@dataplug/tasenor-common'
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

})
