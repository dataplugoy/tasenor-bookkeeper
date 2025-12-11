import React from 'react'
import { observer } from 'mobx-react'
import TextEdit from './TextEdit'
import Store from '../Stores/Store'
import EntryModel from '../Models/EntryModel'
import DocumentModel from '../Models/DocumentModel'
import { haveCursor } from '@tasenor/common'
import withStore from '../Hooks/withStore'

export interface TransactionDetailsProps {
  className: string
  document: DocumentModel
  entry: EntryModel
  error: boolean
  field: string
  index: number
  onComplete: (target: EntryModel | DocumentModel, proposal: unknown, original: unknown) => void
  store: Store
}

export const TransactionDetails = withStore(observer((props: TransactionDetailsProps): JSX.Element => {
  const { store, field, className, document, entry, onComplete } = props

  const cursor = haveCursor()
  const target = field === 'date' ? document : entry

  if ((document.edit && field === 'date') ||
    (entry && entry.edit && entry.column === field)) {

    return (<TextEdit
        value={target.getEdit(field)}
        className={`TransactionDetails ${field}`}
        target={target}
        validate={value => target.validate(field, value)} // TODO: Could be default?
        proposal={value => target.proposal(field, value)} // TODO: Could be default?
        onComplete={(value, proposal, originalValue) => target.change(field, value)
          .then(() => target.save())
          .then(() => target.turnEditorOff(cursor))
          .then(() => onComplete && onComplete(target, proposal, originalValue))
          .then(() => target.store.fetchBalances())
        }
        onCancel={() => target.turnEditorOff(cursor)} // TODO: Could be default?
      />)

  }

  const column = entry ? entry.columns().indexOf(field) : null
  const row = cursor.row

  const isSubSelected = 'isSubSelected' in target && target.isSubSelected(column, row)
  const isCurrent = 'account_id' in target && store.accountId === target.account_id
  const myClassName = 'TransactionDetails hide-overflow ' +
    (field + ' ') +
    (isSubSelected ? ' sub-selected' : '') +
    (isCurrent ? ' current' : '') +
    (className ? ' ' + className : '')

  const view = target.getView(field)
  return (
    <div className={myClassName}>{view}&nbsp;</div>
  )
}))

export default TransactionDetails
