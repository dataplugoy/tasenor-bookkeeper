import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { action } from 'mobx'
import { withTranslation, Trans } from 'react-i18next'
import { Dialog, Money } from '@tasenor/common-ui'
import Tags from './Tags'
import TransactionDetails from './TransactionDetails'
import Store from '../Stores/Store'
import EntryModel from '../Models/EntryModel'
import { TableRow, TableCell, Typography } from '@mui/material'
import { Error } from '@mui/icons-material'
import Catalog from '../Stores/Catalog'
import { haveCursor, haveSettings } from '@tasenor/common'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'

@withTranslation('translations')
@withStore
@withCatalog
@observer
class Transaction extends Component {

  // Temporary store for entry waiting for deletion confirmation.
  entryToDelete = null

  @action.bound
  deleteEntry() {
    const cursor = haveCursor()
    let { index, column, row } = cursor
    this.entryToDelete.delete()
      .then(() => {
        row--
        if (row < 0) {
          row = null
          column = null
          index--
          if (index < 0) {
            index = null
          }
        }
        cursor.topologyChanged()
        cursor.setIndex(index)
        cursor.setCell(column, row)
      })
  }

  // Move to the transaction and toggle it.
  @action.bound
  onClick() {
    const cursor = haveCursor()
    cursor.setComponent('Balances.transactions')
    cursor.setIndex(this.props.index)
    this.props.tx.toggleOpen()
  }

  // Select cell, when clicked.
  @action.bound
  onClickDetail(column, row) {
    const cursor = haveCursor()
    const comp = cursor.getComponent()
    if (!comp || comp.name !== 'Balances.transactions') {
      cursor.setComponent('Balances.transactions')
    }
    if (cursor.index !== this.props.index) {
      cursor.setIndex(this.props.index)
    }
    cursor.setCell(column, row)
  }

  // Handle finalizing editing of a cell.
  @action.bound
  async onComplete(column, row, proposal, originalValue) {
    const { store, tx } = this.props
    const cursor = haveCursor()

    // Handle case where account has been changed so that it moves out of the current screen.
    if (column === 0 && row !== null) {
      const document = tx.document
      const entry = document.entries[row]
      if (originalValue !== entry.account.number && originalValue === store.account.number) {
        store.addMessage(this.props.t('Transaction key account changed and moved out of this screen.'))
        document.open = false
        document.selected = false
        cursor.setIndex(null)
        return
      }
    }

    const document = tx.document
    const entry = document.entries[row]
    const account = entry.account

    // If proposal used, do some additional preparation based on that.
    if (column === 1 && proposal !== null) {
      if (document.entries.length === 1 && document.entries[0].amount === 0 && account) {
        let proposals = await store.fetchEntryProposals(store.db, account.id)
        proposals = proposals
          .filter(p => p.description === proposal && p.credit !== 0 && p.debit !== 0)
          .sort((a, b) => b.documentId - a.documentId)
        if (proposals.length > 0) {
          const { documentId } = proposals[0]
          const old = await store.fetchRawDocument(documentId)
          for (const e of old.entries) {
            if (e.account_id !== account.id) {
              await document.createEntry({
                id: e.account_id,
                amount: e.debit ? e.amount : -e.amount,
                description: e.description
              })
            } else {
              entry.amount = e.amount
              entry.debit = e.debit
              await entry.save()
            }
          }
          await store.fetchBalances()
        }
      }
    }

    const changes = await this.props.catalog.editTransaction(document, row, column, originalValue)
    if (changes.size) {
      await this.props.store.fetchBalances()
    }

    // Move to next cell.
    column++
    if (column === 4) {
      column = 0
      row++
      // Oops, we are on the last column of last row.
      if (row >= document.entries.length) {
        column = 3
        row--
      }
    }
    cursor.setCell(column, row)
    cursor.topologyChanged()
  }

  // Render the main row of the document, i.e. the entry having the current account and data from document it belongs to.
  renderMainTx(error) {
    const { tx } = this.props
    const cursor = haveCursor()
    const settings = haveSettings()

    const money = (<Money currency={settings.get('currency')} cents={tx.amount} />)
    const total = (<Money currency={settings.get('currency')} cents={this.props.total} />)
    const oldDate = tx.document.date
    let currencyValue = <></>
    if (tx.data && tx.data.currency && tx.data.currencyValue) {
      currencyValue = <span style={{ color: 'rgba(0,0,0,0.5)' }}> | <Money cents={tx.data.currencyValue} currency={tx.data.currency}/></span>
    }

    return (
      <TableRow className="Transaction" id={tx.getId()} selected={tx.document.selected} key="title" onClick={() => this.onClick()}>
        <TableCell className="number">
          {this.props.duplicate ? '' : tx.document.number}
        </TableCell>
        <TableCell className="date">
          <TransactionDetails
            index={this.props.index}
            field="date"
            className={tx.open && this.props.index === cursor.index && cursor.row === null && cursor.inComponent('Balances.transactions') ? 'sub-selected' : ''}
            document={tx.document}
            onComplete={async (doc, proposal) => {
              // Find the new row after order by date has been changed.
              const numbers = this.props.store.filteredTransactions.map(tx => tx.document.number)
              cursor.topologyChanged()
              const index = numbers.indexOf(doc.number)
              const changes = await this.props.catalog.editTransaction(tx.document, null, null, oldDate)
              cursor.setIndex(index)
              cursor.setCell(0, 0)
              if (changes.size) {
                await this.props.store.fetchBalances()
              }
            }}
          />
        </TableCell>
        <TableCell className="tags">
          <Tags tags={tx.tags}></Tags>
        </TableCell>
        <TableCell className="description">
          <Typography color={error ? 'error' : 'inherit'}>
            {tx.description}{currencyValue}
            {error && <Error style={{ fontSize: '96%' }}/>}
          </Typography>
        </TableCell>
        <TableCell className="debit" align="right">
          {tx.debit ? money : ''}
        </TableCell>
        <TableCell className="credit" align="right">
          {tx.debit ? '' : money}
        </TableCell>
        <TableCell className="total" align="right">
          {total}
        </TableCell>
      </TableRow>
    )
  }

  // Render an entry for opened document.
  renderEntry(idx, tx) {
    const id = `tx${tx.document.id}-row${idx}`
    const entry = tx.document.entries[idx]
    const sx = { borderLeft: 1, borderColor: '#e0e0e0' }

    return (
      <TableRow id={id} key={idx}>
        <TableCell sx={{ borderBottom: 0 }}/>
        <TableCell colSpan={2} onClick={() => this.onClickDetail(0, idx)} align="left" sx={sx}>
          <TransactionDetails
            index={this.props.index}
            error={!entry.account_id}
            field="account"
            document={entry.document}
            entry={entry}
            onComplete={(_, proposal, originalValue) => this.onComplete(0, idx, proposal, originalValue)}
          />
        </TableCell>
        <TableCell onClick={() => this.onClickDetail(1, idx)} sx={sx}>
          <TransactionDetails
            index={this.props.index}
            field="description"
            document={entry.document}
            entry={entry}
            onComplete={(_, proposal, originalValue) => this.onComplete(1, idx, proposal, originalValue)}
            onClick={() => this.onClickDetail(1, idx)}
          />
        </TableCell>
        <TableCell onClick={() => this.onClickDetail(2, idx)} align="right" sx={sx}>
          <TransactionDetails
            index={this.props.index}
            field="debit"
            document={entry.document}
            entry={entry}
            onClick={() => this.onClickDetail()}
            onComplete={(_, proposal, originalValue) => this.onComplete(2, idx, proposal, originalValue)}
          />
        </TableCell>
        <TableCell onClick={() => this.onClickDetail(3, idx)} align="right" sx={{ borderRight: 1, ...sx }}>
          <TransactionDetails
            index={this.props.index}
            field="credit"
            document={entry.document}
            entry={entry}
            onClick={() => this.onClickDetail()}
            onComplete={(_, proposal, originalValue) => this.onComplete(3, idx, proposal, originalValue)}
          />
        </TableCell>
        <TableCell sx={{ borderBottom: 0 }}/>
      </TableRow>
    )
  }

  render() {
    const tx = this.props.tx
    const settings = haveSettings()

    // Calculate imbalance, missing accounts, and look for deletion request.
    let missingAccount = false

    tx.document.entries.forEach((entry, idx) => {
      if (entry.askForDelete) {
        this.entryToDelete = entry
      }
      if (entry.account_id === 0) { // Null account_id is valid until first save, when it turns to 0.
        missingAccount = true
      }
    })

    const imbalance = tx.document.imbalance()
    const error = !!imbalance || missingAccount

    // Render main transaction.
    const ret = [
      this.renderMainTx(error)
    ]

    // Render entries, if opened.
    if (tx.document.open && !this.props.duplicate) {
      tx.document.entries.forEach((_, idx) => {
        ret.push(this.renderEntry(idx, tx))
      })
    }

    // Render delete dialog in the dummy row.
    if (this.entryToDelete) {
      ret.push(
        <TableRow key="delete">
          <TableCell colSpan={7}>
            <Dialog
              className="DeleteTransaction"
              title={<Trans>Delete this transaction?</Trans>}
              isVisible={this.entryToDelete.askForDelete}
              onClose={() => { this.entryToDelete.askForDelete = null; this.entryToDelete.askForDelete = false }}
              onConfirm={() => this.deleteEntry()}>
              <i>{this.entryToDelete.account && this.entryToDelete.account.toString()}</i><br/>
              {this.entryToDelete.description}<br/>
              <b>{this.entryToDelete.debit ? '+' : '-'}<Money currency={settings.get('currency')} cents={this.entryToDelete.amount}></Money></b>
            </Dialog>
          </TableCell>
        </TableRow>
      )
    }

    // Render imbalance
    if (imbalance && this.props.tx.document.open) {
      ret.push(
        <TableRow key="imbalance">
          <TableCell colSpan={3} />
          <TableCell>
            <Typography color="error">
              <Trans>Debit and credit do not match</Trans>
            </Typography>
          </TableCell>
          <TableCell align="right">
            <Typography color="error">
              {imbalance < 0 ? <Money currency={settings.get('currency')} cents={imbalance}/> : ''}
            </Typography>
          </TableCell>
          <TableCell align="right">
            <Typography color="error">
              {imbalance > 0 ? <Money currency={settings.get('currency')} cents={imbalance}/> : ''}
            </Typography>
          </TableCell>
          <TableCell/>
        </TableRow>)
    }

    return ret
  }
}

Transaction.propTypes = {
  store: PropTypes.instanceOf(Store),
  catalog: PropTypes.instanceOf(Catalog),
  tx: PropTypes.instanceOf(EntryModel),
  t: PropTypes.func,
  index: PropTypes.number,
  duplicate: PropTypes.bool,
  total: PropTypes.number
}

export default Transaction
