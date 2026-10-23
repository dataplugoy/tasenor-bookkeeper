import { describe, expect, test } from '@jest/globals'
import { ImportStateText } from '@tasenor/common'
import { TransactionImportHandler } from '../src/import/TransactionImportHandler'

describe('TransactionImportHandler', () => {

  test('segmentation post processing keeps columns returned by the hook', async () => {
    class Handler extends TransactionImportHandler {
      async segmentationColumnPostProcess(columns: Record<string, unknown>): Promise<Record<string, unknown>> {
        return { ...columns, extra: 'added' }
      }
    }
    const handler = new Handler('Test')
    handler.importOptions.numericFields = ['amount']

    const state = {
      stage: 'segmented',
      files: {
        'test.csv': {
          lines: [
            { line: 0, text: 'A,1,5', segmentId: 'S1', columns: { val: 'A', amount: '1,5' } }
          ]
        }
      }
    } as unknown as ImportStateText<'segmented'>

    const result = await handler.segmentationPostProcess(state)

    expect(result.files['test.csv'].lines[0].columns).toStrictEqual({ val: 'A', amount: 1.5, extra: 'added' })
  })
})
