import { Asset } from '@tasenor/common'
import { UnitTester } from '../src/testing'

test('Handle complex multipart dividend', async () => {

  const tester = new UnitTester()

  tester.set('account.dividend.currency.USD', '5000')
  tester.set('account.income.statement.LISTED_CASH_DIVIDEND', '5001')
  tester.set('account.tax.statement.WITHHOLDING_TAX', '6000')

  await tester.test([
    {
      reason: 'dividend',
      type: 'currency',
      asset: 'USD',
      amount: null,
      data: {
        text: 'CORR PRA(US21870U3041) Cash Dividend USD 0.460938 per Share (Ordinary Dividend)'
      }
    },
    {
      reason: 'income',
      type: 'statement',
      asset: 'LISTED_CASH_DIVIDEND',
      data: {
        text: 'CORR PRA(US21870U3041) Cash Dividend USD 0.460938 per Share (Ordinary Dividend)',
        currency: 'USD',
        currencyValue: -8712,
        count: 189,
        asset: 'CORR PRA' as Asset as Asset,
        perAsset: 0.460938,
        rates: {
          USD: 0.8929
        }
      },
      value: -7779
    },
    {
      reason: 'dividend',
      type: 'currency',
      asset: 'USD',
      amount: null,
      data: {
        text: 'CORR PRA(US21870U3041) Payment in Lieu of Dividend (Ordinary Dividend)'
      }
    },
    {
      reason: 'income',
      type: 'statement',
      asset: 'LISTED_CASH_DIVIDEND',
      data: {
        text: 'CORR PRA(US21870U3041) Payment in Lieu of Dividend (Ordinary Dividend)',
        currency: 'USD',
        currencyValue: -507,
        count: 1,
        asset: 'CORR PRA' as Asset as Asset,
        perAsset: 5.07,
        rates: {
          USD: 0.8929
        }
      },
      value: -453
    },
    {
      reason: 'tax',
      type: 'statement',
      asset: 'WITHHOLDING_TAX',
      data: {
        text: 'CORR PRA(US21870U3041) Cash Dividend USD 0.460938 per Share - US Tax',
        currency: 'USD',
        currencyValue: 1307,
        rates: {
          USD: 0.8929
        }
      },
      value: 1167
    },
    {
      reason: 'tax',
      type: 'statement',
      asset: 'WITHHOLDING_TAX',
      data: {
        text: 'CORR PRA(US21870U3041) Payment in Lieu of Dividend - US Tax',
        currency: 'USD',
        currencyValue: 76,
        rates: {
          USD: 0.8929
        }
      },
      value: 68
    }
  ],
  [[
    {
      account: 'dividend.currency.USD',
      amount: 6612,
      data: {
        currency: 'USD',
        currencyValue: 7405,
        rates: {
          USD: 0.8929,
        },
        text: 'CORR PRA(US21870U3041) Cash Dividend USD 0.460938 per Share (Ordinary Dividend)',
      },
      description: 'Dividend CORR PRA',
    },
    {
      account: 'income.statement.LISTED_CASH_DIVIDEND',
      amount: -7779,
      data: {
        asset: 'CORR PRA' as Asset,
        count: 189,
        currency: 'USD',
        currencyValue: -8712,
        perAsset: 0.460938,
        rates: {
          USD: 0.8929,
        },
        text: 'CORR PRA(US21870U3041) Cash Dividend USD 0.460938 per Share (Ordinary Dividend)',
      },
      description: 'Dividend CORR PRA',
    },
    {
      account: 'dividend.currency.USD',
      amount: 385,
      data: {
        currency: 'USD',
        currencyValue: 431,
        rates: {
          USD: 0.8929,
        },
        text: 'CORR PRA(US21870U3041) Payment in Lieu of Dividend (Ordinary Dividend)',
      },
      description: 'Dividend CORR PRA',
    },
    {
      account: 'income.statement.LISTED_CASH_DIVIDEND',
      amount: -453,
      data: {
        asset: 'CORR PRA' as Asset,
        count: 1,
        currency: 'USD',
        currencyValue: -507,
        perAsset: 5.07,
        rates: {
          USD: 0.8929,
        },
        text: 'CORR PRA(US21870U3041) Payment in Lieu of Dividend (Ordinary Dividend)',
      },
      description: 'Dividend CORR PRA',
    },
    {
      account: 'tax.statement.WITHHOLDING_TAX',
      amount: 1167,
      data: {
        currency: 'USD',
        currencyValue: 1307,
        rates: {
          USD: 0.8929,
        },
        text: 'CORR PRA(US21870U3041) Cash Dividend USD 0.460938 per Share - US Tax',
      },
      description: 'Dividend CORR PRA',
    },
    {
      account: 'tax.statement.WITHHOLDING_TAX',
      amount: 68,
      data: {
        currency: 'USD',
        currencyValue: 76,
        rates: {
          USD: 0.8929,
        },
        text: 'CORR PRA(US21870U3041) Payment in Lieu of Dividend - US Tax',
      },
      description: 'Dividend CORR PRA',
    },
  ]]
  )
})
