import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Account, Document, accountMatches, euros, findEntries, renderDocument, renderReport, totals } from './format'

const accounts = new Map<number, Account>([
  [1, { id: 1, number: '1910', name: 'Nordea', type: 'ASSET' }],
  [2, { id: 2, number: '4000', name: 'Ostot', type: 'EXPENSE' }],
  [3, { id: 3, number: '2939', name: 'ALV-velka 24%', type: 'LIABILITY' }]
])

const documents: Document[] = [
  {
    id: 10,
    number: 1,
    date: '2025-02-01',
    period_id: 7,
    entries: [
      { id: 100, document_id: 10, account_id: 2, debit: true, amount: 12345, description: 'Hetzner server', row_number: 1 },
      { id: 101, document_id: 10, account_id: 1, debit: false, amount: 12345, description: 'Hetzner server', row_number: 2 }
    ]
  },
  {
    id: 11,
    number: 2,
    date: '2025-03-15',
    period_id: 7,
    entries: [
      { id: 102, document_id: 11, account_id: 2, debit: true, amount: 5000, description: 'Domain renewal', row_number: 1 },
      { id: 103, document_id: 11, account_id: 1, debit: false, amount: 4000, description: 'Domain renewal', row_number: 2 }
    ]
  }
]

test('euros formats integer cents', () => {
  assert.equal(euros(-160588), '-1605.88')
  assert.equal(euros(5), '0.05')
  assert.equal(euros(null), '')
  assert.equal(euros(undefined), '')
})

test('digits match an account number prefix only', () => {
  assert.ok(accountMatches(accounts.get(2)!, '4'))
  assert.ok(!accountMatches(accounts.get(1)!, '4'))
  // "24" is in the name of 2939, but digits never match names.
  assert.ok(!accountMatches(accounts.get(3)!, '24'))
  assert.ok(accountMatches(accounts.get(3)!, 'alv'))
})

test('findEntries combines every criterion', () => {
  assert.equal(findEntries(documents, accounts, { text: 'HETZNER' }).length, 2)
  assert.equal(findEntries(documents, accounts, { account: '4' }).length, 2)
  assert.equal(findEntries(documents, accounts, { account: '4', dateFrom: '2025-03-01' }).length, 1)
  assert.equal(findEntries(documents, accounts, { dateTo: '2025-02-01' }).length, 2)
  assert.equal(findEntries(documents, accounts, { minAmount: 50, maxAmount: 100 }).length, 1)
  assert.equal(findEntries(documents, accounts, { text: 'domain', account: 'nordea' })[0].entry.id, 103)
})

test('totals give net as debit minus credit', () => {
  assert.deepEqual(totals(findEntries(documents, accounts, { account: '4' })), { debit: 17345, credit: 0, net: 17345 })
  assert.deepEqual(totals(findEntries(documents, accounts, {})), { debit: 17345, credit: 16345, net: 1000 })
})

test('renderDocument flags an unbalanced document', () => {
  assert.ok(!renderDocument(documents[0], accounts).includes('NOT BALANCED'))
  const text = renderDocument(documents[1], accounts)
  assert.ok(text.includes('NOT BALANCED'))
  assert.ok(text.includes('4000 Ostot | debit 50.00 | Domain renewal'))
})

test('renderReport indents rows, converts currency and cleans titles', () => {
  const text = renderReport({
    format: 'general-ledger',
    meta: { businessName: 'Test Oy', businessId: '123-4' },
    columns: [
      { type: 'name', name: 'title', title: 'column-description' },
      { type: 'currency', name: 'p1', title: '2025' }
    ],
    data: [
      { tab: 0, name: 'LIIKEVAIHTO', values: { p1: 100000 } },
      { tab: 2, name: 'Heading only' }
    ]
  })
  assert.deepEqual(text.split('\n'), [
    'Test Oy (123-4)',
    'Report: general-ledger. Amounts in euros.',
    'description | 2025',
    'LIIKEVAIHTO | 1000.00',
    '    Heading only'
  ])
})
