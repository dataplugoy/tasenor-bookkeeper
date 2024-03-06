import { AdditionalTransferInfo, Asset, Currency, StockBookkeeping, StockChangeData, isStockChangeDelta, isStockChangeFixed, strRound } from '@tasenor/common'
import { Money } from '@tasenor/common-ui'
import { Box, TableCell, TableRow } from '@mui/material'
import React, { Fragment } from 'react'
import { Trans } from 'react-i18next'
import Settings from '../Stores/Settings'
import EntryModel from '../Models/EntryModel'

/**
 * View the stock situation and changes for the given transaction.
 */
export type TransactionStockProps = {
  settings: Settings
  stock: StockBookkeeping
  tx: EntryModel
}

export const TransactionStock = (props: TransactionStockProps): JSX.Element => {

  const { stock, settings, tx } = props
  const currency = settings.get('currency') as Currency

  if (!tx.data || !tx.data.stock) {
    return <></>
  }
  const info: AdditionalTransferInfo = tx.data
  const changedAssets = stock.changedAssets(tx.data as StockChangeData)

  const totals: Partial<Record<Asset, number>> = changedAssets.reduce((prev, cur) => ({ ...prev, [cur]: stock.total(cur) }), {})
  const values: Partial<Record<Asset, number>> = changedAssets.reduce((prev, cur) => ({ ...prev, [cur]: stock.value(cur) }), {})

  const ret: JSX.Element[] = []
  let title: string | undefined
  if (isStockChangeDelta(info.stock)) {
    console.log(changedAssets);
  }

  if (isStockChangeFixed(info.stock)) {
    title = 'Initial values for assets:'
  }
  ret.push(<TransactionStockTotal key={tx.id + '-stock'} title={title} totals={totals} values={values} currency={currency}/>)

  return <>{ret}</>
}

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
      <TableCell variant="footer"/>
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
