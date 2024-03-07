import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation } from 'react-i18next'
import TextEdit from './TextEdit'
import Store from '../Stores/Store'
import EntryModel from '../Models/EntryModel'
import DocumentModel from '../Models/DocumentModel'
import { haveCursor } from '@tasenor/common'
import withRouter from '../Hooks/withRouter'
import withStore from '../Hooks/withStore'

@withRouter
@withTranslation('translations')
@withStore
@observer
class TransactionDetails extends Component {

  render() {
    const cursor = haveCursor()
    const target = this.props.field === 'date' ? this.props.document : this.props.entry

    if ((this.props.document.edit && this.props.field === 'date') ||
      (this.props.entry && this.props.entry.edit && this.props.entry.column === this.props.field)) {

      return (<TextEdit
        value={target.getEdit(this.props.field)}
        className={`TransactionDetails ${this.props.field}`}
        target={target}
        validate={value => target.validate(this.props.field, value)} // TODO: Could be default?
        proposal={value => target.proposal(this.props.field, value)} // TODO: Could be default?
        onComplete={(value, proposal, originalValue) => target.change(this.props.field, value)
          .then(() => target.save())
          .then(() => target.turnEditorOff(cursor))
          .then(() => this.props.onComplete && this.props.onComplete(target, proposal, originalValue))
          .then(() => target.store.fetchBalances())
        }
        onCancel={() => target.turnEditorOff(cursor)} // TODO: Could be default?
      />)
    }

    const column = this.props.entry ? this.props.entry.columns().indexOf(this.props.field) : null
    const row = cursor.row
    const isSubSelected = target.isSubSelected && target.isSubSelected(column, row)
    const isCurrent = target.account_id && this.props.store.accountId === target.account_id
    const className = 'TransactionDetails hide-overflow ' +
      (this.props.field + ' ') +
      (isSubSelected ? ' sub-selected' : '') +
      (isCurrent ? ' current' : '') +
      (this.props.className ? ' ' + this.props.className : '')

    const view = target.getView(this.props.field)

    return (
      <div className={className}>{view}&nbsp;</div>
    )
  }
}

TransactionDetails.propTypes = {
  className: PropTypes.string,
  document: PropTypes.instanceOf(DocumentModel),
  entry: PropTypes.instanceOf(EntryModel),
  error: PropTypes.bool,
  field: PropTypes.string,
  index: PropTypes.number,
  onComplete: PropTypes.func,
  store: PropTypes.instanceOf(Store),
}

export default TransactionDetails
