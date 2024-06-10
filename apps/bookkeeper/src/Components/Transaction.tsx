import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { Trans, useTranslation } from 'react-i18next'
import { Dialog, Money } from '@tasenor/common-ui'
import Tags from './Tags'
import TransactionDetails from './TransactionDetails'
import Store from '../Stores/Store'
import EntryModel from '../Models/EntryModel'
import { TableRow, TableCell, Typography, Box } from '@mui/material'
import { Error } from '@mui/icons-material'
import Catalog from '../Stores/Catalog'
import Cursor from '../Stores/Cursor'
import { Currency, haveCursor, haveSettings } from '@tasenor/common'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'
import Settings from '../Stores/Settings'
import { runInAction } from 'mobx'

export interface TransactionLineProps {
  store: Store
  catalog: Catalog
  cursor: Cursor
  tx: EntryModel
  index: number
  line: number
}

export const TransactionLine = withStore(withCatalog(observer((props: TransactionLineProps): JSX.Element => {
  const { tx, line, index, store, cursor, catalog } = props

  const { t } = useTranslation()

  const id = `tx${tx.document.id}-row${line}`
  const entry = tx.document.entries[line]
  const sx = { borderLeft: 1, borderColor: '#e0e0e0' }

  // Select cell, when clicked.
  const onClickDetail = function(column, row) {
    const comp = cursor.getComponent()
    if (!comp || comp.name !== 'Balances.transactions') {
      cursor.setComponent('Balances.transactions')
    }
    if (cursor.index !== index) {
      cursor.setIndex(index)
    }
    cursor.setCell(column, row)
  }

  // Handle finalizing editing of a cell.
  const onComplete = async function(target, column, row, proposal, originalValue) {

    // Handle case where account has been changed so that it moves out of the current screen.
    if (column === 0 && row !== null) {
      const document = tx.document
      const entry = document.entries[row]
      if (originalValue !== entry.account.number && originalValue === store.account.number) {
        store.addMessage(t('Transaction key account changed and moved out of this screen.'))
        document.open = false
        document.selected = false
        cursor.setIndex(null)
        return
      }
    }

    const document = tx.document
    const entry = document.entries[row]
    const account = entry.account

    // If the selected row is the same than the currently selected account, copy text to all entries.
    if (props.store.account.id === account.id && column === 1) {
      runInAction(async () => {
        for (const other of document.entries) {
          if (other.account_id !== account.id) {
            other.description = entry.description
            await other.save()
          }
        }
      })
    }

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

    const changes = await catalog.editTransaction(document, row, column, originalValue)
    if (changes.size) {
      await store.fetchBalances()
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

  // Render an entry for opened document.
  return (
      <TableRow id={id} key={id}>
        <TableCell sx={{ borderBottom: 0 }}/>
        <TableCell colSpan={2} onClick={() => onClickDetail(0, line)} align="left" sx={sx}>
          <TransactionDetails
            index={index}
            error={!entry.account_id}
            field="account"
            document={entry.document}
            entry={entry}
            onComplete={(target, proposal, originalValue) => onComplete(target, 0, line, proposal, originalValue)}
          />
        </TableCell>
        <TableCell onClick={() => onClickDetail(1, line)} sx={sx}>
          <TransactionDetails
            index={index}
            field="description"
            document={entry.document}
            entry={entry}
            onComplete={(target, proposal, originalValue) => onComplete(target, 1, line, proposal, originalValue)}
            onClick={() => onClickDetail(1, line)}
          />
        </TableCell>
        <TableCell onClick={() => onClickDetail(2, line)} align="right" sx={sx}>
          <TransactionDetails
            index={index}
            field="debit"
            document={entry.document}
            entry={entry}
            onClick={() => onClickDetail(2, line)}
            onComplete={(target, proposal, originalValue) => onComplete(target, 2, line, proposal, originalValue)}
          />
        </TableCell>
        <TableCell onClick={() => onClickDetail(3, line)} align="right" sx={{ borderRight: 1, ...sx }}>
          <TransactionDetails
            index={index}
            field="credit"
            document={entry.document}
            entry={entry}
            onClick={() => onClickDetail(3, line)}
            onComplete={(target, proposal, originalValue) => onComplete(target, 3, line, proposal, originalValue)}
          />
        </TableCell>
        <TableCell sx={{ borderBottom: 0 }}/>
      </TableRow>
  )
})))

export interface MainTransactionProps {
  store: Store
  catalog: Catalog
  settings: Settings
  tx: EntryModel
  total: number
  index: number
  cursor: Cursor
  duplicate: boolean
  error: boolean
}

// Render the main row of the document, i.e. the entry having the current account and data from document it belongs to.
export const MainTransaction = withStore(withCatalog(observer((props: MainTransactionProps): JSX.Element => {
  const { tx, index, total, duplicate, error, cursor, store, catalog, settings } = props

  const moneyJsx = (<Money currency={settings.get('currency') as Currency} cents={tx.amount} />)
  const totalJsx = (<Money currency={settings.get('currency') as Currency} cents={total} />)
  const oldDate = tx.document.date
  let currencyValue = <></>

  if (tx.data && tx.data.currency && tx.data.currencyValue) {
    currencyValue = <span style={{ color: 'rgba(0,0,0,0.5)' }}> | <Money cents={tx.data.currencyValue as number} currency={tx.data.currency as Currency}/></span>
  }

  // Move cursor to the transaction and toggle it.
  const onClick = function() {
    cursor.setComponent('Balances.transactions')
    cursor.setIndex(index)
    tx.toggleOpen()
  }

  return (
    <TableRow className="Transaction" id={tx.getId()} selected={tx.document.selected} key="title" onClick={onClick}>
      <TableCell className="number">
        {duplicate ? '' : tx.document.number}
      </TableCell>
      <TableCell className="date">
        <TransactionDetails
          index={index}
          field="date"
          className={tx.open && index === cursor.index && cursor.row === null && cursor.inComponent('Balances.transactions') ? 'sub-selected' : ''}
          document={tx.document}
          onComplete={async (doc) => {
            // Find the new row after order by date has been changed.
            const numbers = store.filteredTransactions.map(tx => tx.document.number)
            cursor.topologyChanged()
            const index = numbers.indexOf(doc.number)
            const changes = await catalog.editTransaction(tx.document, null, null, oldDate)
            cursor.setIndex(index)
            cursor.setCell(0, 0)
            if (changes.size) {
              await store.fetchBalances()
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
        {tx.debit ? moneyJsx : ''}
      </TableCell>
      <TableCell className="credit" align="right">
        {tx.debit ? '' : moneyJsx}
      </TableCell>
      <TableCell className="total" align="right">
        {totalJsx}
      </TableCell>
    </TableRow>
  )
})))

export interface TransactionProps {
  store: Store
  catalog: Catalog
  tx: EntryModel
  index: number
  total: number
  duplicate: boolean
}

export const Transaction = withStore(withCatalog(observer((props: TransactionProps): JSX.Element => {
  const [entryToDelete, setEntryToDelete] = useState<EntryModel|null>(null)
  const [dataEntryToDelete, setDataEntryToDelete] = useState<EntryModel|null>(null)

  const { tx, total, duplicate, index } = props
  const settings = haveSettings()
  const cursor = haveCursor()

  // Calculate imbalance, missing accounts, and look for deletion request.
  let missingAccount = false

  tx.document.entries.forEach((entry) => {
    if (!entryToDelete && entry.askForDelete) {
      setEntryToDelete(entry)
    }
    if (!dataEntryToDelete && entry.askDataForDelete !== null) {
      setDataEntryToDelete(entry)
    }
    if (entry.account_id === 0) { // Null account_id is valid until first save, when it turns to 0.
      missingAccount = true
    }
  })

  const imbalance = tx.document.imbalance()
  const error = !!imbalance || missingAccount

  // Render main transaction.
  const ret = [
    <MainTransaction key={tx.id || 0} total={total} tx={tx} index={index} duplicate={duplicate} error={error} cursor={cursor} settings={settings}/>
  ]

  // Render entries, if opened.
  if (tx.document.open && !duplicate) {
    tx.document.entries.forEach((_, idx) => {
      ret.push(<TransactionLine key={tx.id + '-' + idx} tx={tx} line={idx} index={index} cursor={cursor}/>)
    })
  }

  // Render imbalance
  if (imbalance && tx.document.open) {
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
            {imbalance < 0 ? <Money currency={settings.get('currency') as Currency} cents={imbalance}/> : ''}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography color="error">
            {imbalance > 0 ? <Money currency={settings.get('currency') as Currency} cents={imbalance}/> : ''}
          </Typography>
        </TableCell>
        <TableCell/>
      </TableRow>
    )
  }

  // Helper to handle cursor when deleting a row.
  const cursorDeleteRow = () => {
    let { index, column, row } = cursor
    row = (row || 0) - 1
    if (row < 0) {
      row = null
      column = null
      index = (index || 0) - 1
      if (index < 0) {
        index = null
      }
    }
    cursor.topologyChanged()
    cursor.setIndex(index)
    cursor.setCell(column, row)
  }

  // Render transaction line delete dialog in the dummy row.
  if (entryToDelete) {
    const onDeleteEntry = function() {
      entryToDelete.delete()
        .then(() => {
          cursorDeleteRow()
          setEntryToDelete(null)
        })
    }

    ret.push(
      <TableRow key="delete">
        <TableCell colSpan={7}>
          <Dialog
            className="DeleteTransaction"
            title={<Trans>Delete this transaction?</Trans>}
            isVisible={entryToDelete.askForDelete}
            onClose={() => { runInAction(() => (entryToDelete.askForDelete = false)); setEntryToDelete(null) }}
            onConfirm={onDeleteEntry}
          >
            <i>{entryToDelete.account && entryToDelete.account.toString()}</i><br/>
            {entryToDelete.description}<br/>
            <b>{entryToDelete.debit ? '+' : '-'}<Money currency={settings.get('currency') as Currency} cents={entryToDelete.amount}></Money></b>
          </Dialog>
        </TableCell>
      </TableRow>
    )
  }

  // Render data entry delete dialog in the dummy row.
  if (dataEntryToDelete) {
    const onDeleteEntry = function() {
      dataEntryToDelete.deleteData(dataEntryToDelete.askDataForDelete as number).then(() => {
        cursorDeleteRow()
        setDataEntryToDelete(null)
      })
    }

    ret.push(
        <TableRow key="delete">
          <TableCell colSpan={7}>
            <Dialog
              className="DeleteTransaction"
              title={<Trans>Delete this data line?</Trans>}
              isVisible={dataEntryToDelete.askDataForDelete !== null}
              onClose={() => { runInAction(() => (dataEntryToDelete.askDataForDelete = null)); setDataEntryToDelete(null) }}
              onConfirm={onDeleteEntry}
            >
              <b>{dataEntryToDelete.describeData(dataEntryToDelete.askDataForDelete as number)}</b>
              <Box sx={{ my: 2, textAlign: 'center' }}><Trans>from this entry</Trans></Box>
              <i>{dataEntryToDelete.account && dataEntryToDelete.account.toString()}</i><br/>
              {dataEntryToDelete.description}
            </Dialog>
          </TableCell>
        </TableRow>
    )
  }

  return <>{ret}</>
})))

export default Transaction
