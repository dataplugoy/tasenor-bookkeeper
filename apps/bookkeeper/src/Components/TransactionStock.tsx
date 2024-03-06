import { observer } from 'mobx-react'
import { AdditionalTransferInfo, Asset, Currency, StockBookkeeping, StockChangeData, StockValueData, haveCursor, isStockChangeDelta, isStockChangeFixed, strRound } from '@tasenor/common'
import { Money } from '@tasenor/common-ui'
import { Box, TableCell, TableRow } from '@mui/material'
import React, { Fragment } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import Settings from '../Stores/Settings'
import EntryModel from '../Models/EntryModel'

/**
 * View the stock situation and changes for the given transaction.
 */
export type TransactionStockProps = {
  settings: Settings
  stock: StockBookkeeping
  tx: EntryModel
  index: number
}

export const TransactionStock = observer((props: TransactionStockProps): JSX.Element => {

  const { stock, settings, tx, index } = props
  const currency = settings.get('currency') as Currency
  const { t } = useTranslation()
  const cursor = haveCursor()

  if (!tx.data || !tx.data.stock) {
    return <></>
  }
  const info: AdditionalTransferInfo = tx.data
  const changedAssets = stock.changedAssets(tx.data as StockChangeData)

  const totals: Partial<Record<Asset, number>> = changedAssets.reduce((prev, cur) => ({ ...prev, [cur]: stock.total(cur) }), {})
  const values: Partial<Record<Asset, number>> = changedAssets.reduce((prev, cur) => ({ ...prev, [cur]: stock.value(cur) }), {})

  const ret: JSX.Element[] = []
  let title: string | undefined
  if (tx.open && isStockChangeDelta(info)) {
    ret.push(<EmptyStockChange key={'start'}/>)
    let lineNo = tx.document.entries.length
    Object.entries(info.stock.change).forEach((c) => {
      const [name, { value, amount }] = c as [Asset, StockValueData]
      ret.push(<TransactionStockChange
        key={`change-${name}`}
        asset={name}
        value={value}
        amount={amount}
        currency={currency}
        selectedColumn={cursor.index === index && cursor.row === lineNo ? cursor.column : null}
      />)
      lineNo++
    })
    ret.push(<EmptyStockChange key={'end'}/>)
  }

  if (isStockChangeFixed(info)) {
    title = t('Initial values for assets:')
  }
  ret.push(<TransactionStockTotal key={tx.id + '-stock'} title={title} totals={totals} values={values} currency={currency}/>)

  return <>{ret}</>
})

export interface TransactionStockTotalProps {
  values: Partial<Record<Asset, number>>
  totals: Partial<Record<Asset, number>>
  currency: Currency
  title?: string
}

export const TransactionStockTotal = (props: TransactionStockTotalProps): JSX.Element => {
  const { totals, values, currency, title } = props

  return (
    <TableRow>
      <TableCell variant="footer"/>
      <TableCell variant="footer" />
      <TableCell variant="footer"/>
      <TableCell colSpan={4} variant="footer">
        {title && <Box>{title}</Box>}
        <Trans>abbrev-Total</Trans>&nbsp;
        {
          Object.entries(totals).map(([asset, amount]) =>
            <Fragment key={asset}>
              {strRound(amount as number)} x {asset}
              {' '}
              {amount ? <>(<Money currency={currency} cents={values[asset] / (amount as number)}/>&nbsp;/&nbsp;{asset})</> : ''}
              &nbsp;&nbsp;
            </Fragment>
          )
        }
      </TableCell>
    </TableRow>
  )
}

export interface TransactionStockChangeProps {
  asset: Asset
  value: number
  amount: number
  currency: Currency
  selectedColumn: number | null
}

export const TransactionStockChange = (props: TransactionStockChangeProps): JSX.Element => {

  const { asset, value, amount, currency, selectedColumn } = props

  return (
    <TableRow>
      <TableCell sx={{ border: 0 }} variant="footer"/>
      <TableCell colSpan={2} variant="footer" className={selectedColumn === 0 ? 'sub-selected' : ''}>
        <Trans>Asset value change:</Trans>
      </TableCell>
      <TableCell variant="footer" align="right" className={selectedColumn === 1 ? 'sub-selected' : ''}>
        {asset}
      </TableCell>
      <TableCell variant="footer" align="right" className={selectedColumn === 2 ? 'sub-selected' : ''}>
        {amount >= 0 ? '+' : ''}{amount}
      </TableCell>
      <TableCell variant="footer" align="right" className={selectedColumn === 3 ? 'sub-selected' : ''}>
        {value >= 0 ? '+' : ''}<Money currency={currency} cents={value}/>
      </TableCell>
      <TableCell sx={{ border: 0 }} variant="footer"/>
    </TableRow>
  )
}

export const EmptyStockChange = (): JSX.Element => {
  return (
    <TableRow>
      <TableCell colSpan={6} sx={{ border: 0, height: '0.5rem' }}></TableCell>
    </TableRow>
  )
}
