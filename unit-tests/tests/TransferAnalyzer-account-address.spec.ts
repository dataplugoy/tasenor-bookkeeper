import { test } from '@jest/globals'
import { UnitTester } from '../src/UnitTester'

test('Direct expense account address', async () => {

  const tester = new UnitTester()

  await tester.test(
    // Use direct reference to the account.
    [
      {
        reason: 'expense',
        type: 'account',
        asset: '112233',
        amount: -200,
        data: {
          text: 'My expense paid'
        }
      },
      {
        reason: 'expense',
        type: 'account',
        asset: '445566',
        amount: 200
      }
    ], [[
      {
        account: '112233',
        amount: -20000,
        description: 'My expense paid',
        data: {
          text: 'My expense paid'
        }
      },
      {
        account: '445566',
        amount: 20000,
        description: 'My expense paid',
      }
    ]]
  )
})

test('Direct income account address', async () => {

  const tester = new UnitTester()

  await tester.test(
    // Use direct reference to the account.
    [
      {
        reason: 'income',
        type: 'account',
        asset: '112233',
        amount: -200,
        data: {
          text: 'My income paid.'
        }
      },
      {
        reason: 'income',
        type: 'account',
        asset: '445566',
        amount: 200,
        data: {
          text: 'Yes it is.'
        }
      }
    ], [[
      {
        account: '112233',
        amount: -20000,
        description: 'My income paid. Yes it is.',
        data: {
          text: 'My income paid.'
        }
      },
      {
        account: '445566',
        amount: 20000,
        description: 'My income paid. Yes it is.',
        data: {
          text: 'Yes it is.'
        }
      }
    ]]
  )
})
