import { Trans, useTranslation } from 'react-i18next'
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { ID, ImportExecutionResult } from '@tasenor/common'
import React from 'react'
import DocumentModel from '../Models/DocumentModel'
import EntryModel from '../Models/EntryModel'
import { Money } from '@tasenor/common-ui'
import { CheckTwoTone, ContentCopyTwoTone, DeleteForeverTwoTone, HourglassFullTwoTone, QuestionMarkTwoTone, Restore } from '@mui/icons-material'

/**
 * View only display for a single transaction.
 */
export type TransactionEntryViewProps = {
  id?: ID
  date?: string
  entry: EntryModel
}
export const TransactionEntryView = (props: TransactionEntryViewProps): JSX.Element => {
  const { id, date, entry } = props
  return (
    <TableRow>
      <TableCell><strong>{id}</strong></TableCell>
      <TableCell align="left">{date}</TableCell>
      <TableCell align="left">{entry['get.account']()}</TableCell>
      <TableCell align="left">{entry['get.description']()}</TableCell>
      <TableCell align="right">{entry['get.debit']()}</TableCell>
      <TableCell align="right">{entry['get.credit']()}</TableCell>
    </TableRow>
  )
}

/**
 * Display what execution did to the transaction.
 */
export type TransactionExecutionResultProps = {
  result: ImportExecutionResult
}
export const TransactionExecutionResult = (props: TransactionExecutionResultProps): JSX.Element => {
  let Icon
  let text
  let explanation
  let color
  switch (props.result) {
    case 'ignored':
      Icon = DeleteForeverTwoTone
      text = 'Ignored'
      color = 'orange'
      explanation = 'This transaction has been ignored.'
      break
    case 'not done':
      Icon = HourglassFullTwoTone
      text = 'Not Done'
      color = 'blue'
      explanation = 'This transaction has not been added to the period yet.'
      break
    case 'created':
      Icon = CheckTwoTone
      text = 'Created'
      color = 'green'
      explanation = 'This transaction has been successfully created.'
      break
    case 'duplicate':
      Icon = ContentCopyTwoTone
      text = 'Duplicate'
      color = 'error.main'
      explanation = 'There was already an existing transaction matching.'
      break
    case 'skipped':
      Icon = ContentCopyTwoTone
      text = 'Skipped'
      color = 'orange'
      explanation = 'These has been explicitly skipped.'
      break
    case 'reverted':
      Icon = Restore
      text = 'Reverted'
      color = 'orange'
      explanation = 'These has been rolled back.'
      break
    default:
      Icon = QuestionMarkTwoTone
      text = 'Unknown'
      color = 'error.main'
      explanation = 'The status is unknown.'
  }

  const { t } = useTranslation()

  return <Box sx={{ color, verticalAlign: 'middle', fontWeight: 'bold' }} title={t(explanation)}>
    <Icon/> <Trans>state-{text}</Trans>
  </Box>
}

/**
 * View only display for a single transaction.
 */
export type TransactionViewProps = {
  transaction: DocumentModel
}
export const TransactionView = (props: TransactionViewProps): JSX.Element => {
  const tx = props.transaction
  let debit = 0
  let credit = 0
  const currency = tx.entries.length && tx.entries[0].account ? tx.entries[0].account.currency : undefined
  return <>
    {
      tx.entries.map((entry, idx) => {
        if (entry.debit) {
          debit += entry.amount
        } else {
          credit += entry.amount
        }
        return <TransactionEntryView
          key={idx}
          id={idx === 0 ? tx.id : undefined}
          date={idx === 0 ? tx['get.date']() : undefined}
          entry={entry}
        />
      })
    }
    {
      debit !== credit && (
        <TableRow>
          <TableCell></TableCell>
          <TableCell align="left"></TableCell>
          <TableCell align="left" sx={{ color: 'error.main' }} colSpan={2}><Trans>Debit and credit do not match</Trans></TableCell>
          <TableCell align="right" sx={{ color: 'error.main' }}>{debit < credit ? <Money cents={credit - debit} currency={currency}/> : ''}</TableCell>
          <TableCell align="right" sx={{ color: 'error.main' }}>{debit > credit ? <Money cents={debit - credit} currency={currency}/> : ''}</TableCell>
        </TableRow>
      )
    }
    {
      tx.executionResult &&
        <TableRow>
          <TableCell colSpan={6}><TransactionExecutionResult result={tx.executionResult}/></TableCell>
        </TableRow>

    }
  </>
}

/**
 * View only display for a list of transactions.
 */
export type TransactionListViewProps = {
  transactions: DocumentModel[]
}
export const TransactionListView = (props: TransactionListViewProps): JSX.Element => {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead sx={{ backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.1) }}>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell align="left"><Trans>Date</Trans></TableCell>
            <TableCell align="left"><Trans>Account</Trans></TableCell>
            <TableCell align="left"><Trans>Description</Trans></TableCell>
            <TableCell align="right"><Trans>Debit</Trans></TableCell>
            <TableCell align="right"><Trans>Credit</Trans></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.transactions.map((tx, idx) => <TransactionView key={idx} transaction={tx} />)}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
