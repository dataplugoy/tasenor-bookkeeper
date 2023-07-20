import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer } from 'mobx-react'
import { Trans, withTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { sprintf } from 'sprintf-js'
import { Dialog, Money } from '@dataplug/tasenor-common-ui'
import Transaction from './Transaction'
import { TransactionStock } from './TransactionStock'
import Store from '../Stores/Store'
import EntryModel from '../Models/EntryModel'
import DocumentModel from '../Models/DocumentModel'
import { withRouter } from 'react-router-dom'
import { TableContainer, Table, TableHead, TableCell, TableRow, TableBody, Typography, TextField, MenuItem } from '@mui/material'
import { runInAction } from 'mobx'
import { haveCursor, haveSettings, StockBookkeeping } from '@dataplug/tasenor-common'

@withTranslation('translations')
@withRouter
@inject('store')
@observer
class TransactionTable extends Component {

  state = {
    showAccountDropdown: false,
    account: ''
  }

  // Store for transaction waiting for deletion confirmation.
  txToDelete = null

  componentDidMount() {
    const cursor = haveCursor()
    cursor.selectPage('Balances', this)
  }

  componentDidUpdate(oldProps) {
    const cursor = haveCursor()
    const eid = new URLSearchParams(this.props.location.search).get('entry')
    if (eid) {
      cursor.setIndex(null)
      this.closeAll()
      this.props.history.push(this.props.location.pathname)
    }
  }

  closeAll() {
    this.props.store.filteredTransactions.forEach(tx => {
      if (tx.open) {
        tx.toggleOpen()
      }
    })
  }

  keyEscape(cursor) {
    if (cursor.index === null) {
      this.closeAll()
      return { preventDefault: true }
    }
  }

  keyTab(cursor) {
    const { store } = this.props
    if (store.period.locked) {
      return
    }
    if (cursor.componentX !== 1) {
      return
    }
    // Insert entry.
    this.addTxRow(cursor)
    return { preventDefault: true }
  }

  addTxRow(cursor) {
    const { store } = this.props
    const currentDoc = store.filteredTransactions[cursor.index].document
    const rowNumber = currentDoc.entries.reduce((prev, cur) => Math.max(prev, cur.row_number), 0) + 1
    const description = currentDoc.entries.length ? currentDoc.entries[currentDoc.entries.length - 1].text : ''
    const entry = new EntryModel(currentDoc, { document_id: currentDoc.id, row_number: rowNumber, description })
    currentDoc.addEntry(entry)
    cursor.setCell(0, currentDoc.entries.length - 1)
    cursor.topologyChanged()
  }

  keyIconA(cursor) {
    const { store } = this.props
    if (store.period.locked) {
      return { preventDefault: true }
    }
    if (!store.accountId) {
      this.setState({ showAccountDropdown: true })
      return { preventDefault: true }
    }

    if (cursor.row !== null) {
      this.addTxRow(cursor)
      return { preventDefault: true }
    }

    // Resolve date.
    let date = store.lastDate || dayjs().format('YYYY-MM-DD')
    if (date < store.period.start_date) {
      date = store.period.start_date
    }
    if (date > store.period.end_date) {
      date = store.period.end_date
    }

    // Insert new document.
    const document = new DocumentModel(store.period, {
      period_id: store.period.id,
      date
    })
    document.save()
      .then(() => {
        runInAction(() => {
          const entry = new EntryModel(document, { document_id: document.id, row_number: 1, account_id: store.accountId })
          document.addEntry(entry)
          store.period.addDocument(document)
          cursor.topologyChanged()
          entry.toggleOpen()
          if (cursor.componentX === 0) {
            cursor.keyArrowRight()
          }
          const index = store.filteredTransactions.findIndex(tx => document.id === tx.document.id)
          cursor.setIndex(index >= 0 ? index : store.filteredTransactions.length - 1)
        })
      })

    return { preventDefault: true }
  }

  keyIconX(cursor) {
    if (cursor.inComponent('Balances.transactions')) {
      const { store } = this.props
      const entry = store.filteredTransactions[cursor.index]
      const document = entry.document
      if (cursor.row === null) {
        if (!document.canEdit()) {
          return
        }
        runInAction(() => document.markForDeletion())
      } else {
        if (!document.entries[cursor.row].canEdit()) {
          return
        }
        runInAction(() => document.entries[cursor.row].markForDeletion())
      }
    }
    return { preventDefault: true }
  }

  /**
   * Toggle open for entry if closed.
   */
  keyArrowRight(cursor) {
    const { store } = this.props
    if (cursor.index === null || cursor.componentX !== 1 || cursor.row !== null) {
      return
    }
    const entry = store.filteredTransactions[cursor.index]
    if (!entry.open) {
      entry.toggleOpen()
      return { preventDefault: true }
    }
  }

  /**
   * Toggle close for entry if open.
   */
  keyArrowLeft(cursor) {
    const { store } = this.props
    if (cursor.index === null || cursor.componentX !== 1 || cursor.row !== null) {
      return
    }
    const entry = store.filteredTransactions[cursor.index]
    if (entry.open) {
      entry.toggleOpen()
      return { preventDefault: true }
    }
  }

  /**
   * Collect current transaction.
   */
  keyIconC(cursor) {
    if (cursor.index === null || cursor.componentX !== 1) {
      return
    }
    if (!navigator.clipboard) {
      return
    }

    const { store } = this.props
    const doc = store.filteredTransactions[cursor.index].document

    if (cursor.row !== null) {
      // Copy one cell.
      const entry = doc.entries[cursor.row]
      const column = entry.column
      let text
      switch (column) {
        case 'account':
          text = entry.account.toString()
          break
        case 'description':
          text = entry['get.description']()
          break
        case 'debit':
          text = entry.debit ? sprintf('%.2f', entry.amount / 100) : ''
          break
        case 'credit':
          text = entry.debit ? '' : sprintf('%.2f', entry.amount / 100) + ''
          break
        default:
      }
      navigator.clipboard.writeText(text)
      return
    }

    // Copy entire document with entries.
    let text = `${doc.number}\t${doc.date}\n`
    doc.entries.forEach(e => {
      text += [e.account.toString(), e.description, e.debit ? e.amount : '', e.debit ? '' : e.amount].join('\t') + '\n'
    })
    navigator.clipboard.writeText(text)
  }

  /**
   * Create new document if valid clipboard.
   * @param {Cursor} cursor
   */
  keyIconV(cursor) {
    if (cursor.index === null || cursor.componentX !== 1) {
      return
    }
    if (!navigator.clipboard) {
      return
    }
    if (this.props.store.period.locked) {
      this.props.store.addError(this.props.t('Cannot edit this entry. Period locked?'))
      return
    }
    if (cursor.row !== null) {
      // Copy one cell.
      const doc = this.props.store.filteredTransactions[cursor.index].document
      const entry = doc.entries[cursor.row]
      const column = entry.column
      navigator.clipboard.readText().then(text => {
        runInAction(() => {
          if (entry[`validate.${column}`](text) === null) {
            entry[`change.${column}`](text)
            entry.save()
          }
        })
      })
      return
    }

    // Copy entire document.
    navigator.clipboard.readText().then(async text => {
      // Verify the correct format and construct document.
      if (text.endsWith('\n')) {
        text = text.substr(0, text.length - 1)
        const lines = text.split('\n')
        if (lines.length >= 2) {
          const head = lines[0].split('\t')
          if (head.length === 2 && /^\d+$/.test(head[0]) && /^\d\d\d\d-\d\d-\d\d$/.test(head[1])) {
            const [, date] = head
            const entries = []
            let i
            for (i = 1; i < lines.length; i++) {
              const [acc, description, debit, credit] = lines[i].split('\t')
              if (/^\d+ /.test(acc) && (/^\d+$/.test(debit) || /^\d+$/.test(credit))) {
                entries.push({
                  description,
                  number: parseInt(acc),
                  amount: debit === '' ? -parseInt(credit) : parseInt(debit)
                })
              } else {
                break
              }
            }
            // Not all valid. Skip.
            if (i < lines.length) {
              return
            }
            // Create new document.
            const { store } = this.props
            await store.period.createDocument({
              date,
              entries
            })
            cursor.topologyChanged()
          }
        }
      }
    })
  }

  /**
   * Remove a document and all of its entries from the system.
   * @param {TransactionModel} tx
   */
  deleteDocument(tx) {
    const cursor = haveCursor()
    tx.document.delete()
      .then(() => {
        cursor.topologyChanged()
        cursor.changeIndexBy(-1)
      })
  }

  /**
   * Select the initial account on empty table.
   */
  async onSelectAccount(id) {
    const cursor = haveCursor()
    if (!id) {
      return
    }
    await this.props.store.setAccount(this.props.store.db, this.props.store.periodId, id)
    this.keyIconA(cursor)
  }

  render() {
    const settings = haveSettings()
    const ret = []

    if (this.state.showAccountDropdown) {
      const accountDialog = (
        <Dialog key="dialog2"
          className="SelectAccount"
          wider
          title={<Trans>Please select an account</Trans>}
          isVisible={this.state.showAccountDropdown}
          onClose={() => this.setState({ showAccountDropdown: false })}
          onConfirm={() => this.onSelectAccount(this.state.account)}>

          <TextField
            id="Select Account"
            select
            fullWidth
            label={<Trans>Account</Trans>}
            value={this.state.account}
            onChange={(e) => this.setState({ account: e.target.value })}
          >
            <MenuItem value=''>&nbsp;</MenuItem>
            {this.props.store.accounts.map(a => <MenuItem id={`Account ${a.number}`} value={a.id} key={a.id}>{a.toString()}</MenuItem>)}
          </TextField>
        </Dialog>
      )
      ret.push(accountDialog)
    }

    if (!this.props.store.transactions.length) {
      ret.push(<Typography key="insert" color="primary"><Trans>Press Ctrl+A to create a transaction.</Trans></Typography>)
      return ret
    }

    const deleteDialog = (tx) => (
    <Dialog key="dialog"
      className="DeleteTransaction"
      title={<Trans>Delete these transactions?</Trans>}
      isVisible={tx.document.askForDelete}
      onClose={() => { runInAction(() => { tx.document.askForDelete = false; this.txToDelete = null }) }}
      onConfirm={() => this.deleteDocument(tx)}>
      <i>#{tx.document.number}</i><br/>
      {tx.document.entries.map((entry, idx) =>
        <div key={idx}>
          <i>{entry.account && entry.account.toString()}:</i><br/>
          {entry.description} <b> {entry.debit ? '+' : '-'}<Money currency={settings.get('currency')} cents={entry.amount}></Money></b><br/>
        </div>
      )}<br/>
    </Dialog>)

    let sum = 0
    let debit = null
    let credit = null

    const seen = new Set()
    const txs = this.props.store.filteredTransactions
    const stock = new StockBookkeeping('Transaction view')

    let delta = null
    if (txs.length && (txs[0].document.number === 0 || txs[0].document.number === 1)) {
      delta = txs[0].total
    }

    ret.push(
      <TableContainer key="totals">
        <Table className="TransactionTable" size="medium" padding="none">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '3rem' }} variant="head" align="left"><Trans>#</Trans></TableCell>
              <TableCell style={{ width: '7rem' }} variant="head" align="left"><Trans>Date</Trans></TableCell>
              <TableCell style={{ width: '6rem' }} variant="head" align="left"></TableCell>
              <TableCell variant="head" align="left"><Trans>Description</Trans></TableCell>
              <TableCell style={{ width: '9rem' }} variant="head" align="right"><Trans>Debit</Trans></TableCell>
              <TableCell style={{ width: '9rem' }} variant="head" align="right"><Trans>Credit</Trans></TableCell>
              <TableCell style={{ width: '9rem' }} variant="head" align="right"><Trans>Total</Trans></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              txs.map((tx, idx) => {
                if (tx.document.askForDelete) {
                  this.txToDelete = tx
                }
                // Mark duplicate lines.
                const duplicate = seen.has(tx.document.number)
                seen.add(tx.document.number)

                // Calculate running totals.
                sum += tx.total
                if (tx.debit) {
                  debit += tx.amount
                } else {
                  credit += tx.amount
                }

                // Update assets, if included.
                if (tx.data && tx.data.stock) {
                  stock.apply(tx.document.date, tx.data)
                }
                const changes = stock.changedAssets(tx.data)
                const totals = changes.reduce((prev, cur) => ({ ...prev, [cur]: stock.total(cur) }), {})
                const values = changes.reduce((prev, cur) => ({ ...prev, [cur]: stock.value(cur) }), {})

                return <React.Fragment key={idx}>
                  <Transaction
                    index={idx}
                    duplicate={duplicate}
                    tx={tx}
                    total={sum}
                  />
                  { changes.length > 0 && <TransactionStock currency={settings.get('currency')} values={values} totals={totals}/>}
                </React.Fragment>
              })}
            <TableRow className="totals">
              <TableCell variant="footer"/>
              <TableCell variant="footer"/>
              <TableCell variant="footer"/>
              <TableCell variant="footer" style={{ fontWeight: 'bold' }}>
                <Trans>Total lines</Trans> {txs.length}
              </TableCell>
              <TableCell variant="footer" align="right" style={{ fontWeight: 'bold' }}>
                {debit !== null && <Money currency={settings.get('currency')} cents={debit}/>}
              </TableCell>
              <TableCell variant="footer" align="right" style={{ fontWeight: 'bold' }}>
                {credit !== null && <Money currency={settings.get('currency')} cents={credit}/>}
              </TableCell>
              <TableCell variant="footer" align="right" style={{ fontWeight: 'bold' }}>
                {delta !== null && <>Δ <Money currency={settings.get('currency')} cents={sum - delta}/></>}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    )

    if (this.txToDelete) {
      ret.push(deleteDialog(this.txToDelete))
    }

    setTimeout(() => {
      const { index, row } = haveCursor()
      const txs = this.props.store.filteredTransactions
      if (index === null || index >= txs.length) {
        return
      }
      const doc = txs[index].document
      const id = txs.length > 5 ? `tx${doc.id}-row${doc.entries.length - 1}` : `tx${doc.id}-row${row}`
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      }
    }, 0)

    return ret
  }
}

TransactionTable.propTypes = {
  location: PropTypes.object,
  history: ReactRouterPropTypes.history,
  store: PropTypes.instanceOf(Store),
  t: PropTypes.func
}

export default TransactionTable
