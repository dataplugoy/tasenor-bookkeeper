import { Asset, Currency, StockBookkeeping, StockChangeData, strRound } from '@tasenor/common'
import { Money } from '@tasenor/common-ui'
import { TableCell, TableRow } from '@mui/material'
import React, { Fragment } from 'react'
import { Trans } from 'react-i18next'
import Settings from '../Stores/Settings'
import EntryModel from '../Models/EntryModel'

/**
 * View the stock situation for the given assets.
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
  const changes = stock.changedAssets(tx.data as StockChangeData)

  const totals = changes.reduce((prev, cur) => ({ ...prev, [cur]: stock.total(cur) }), {})
  const values = changes.reduce((prev, cur) => ({ ...prev, [cur]: stock.value(cur) }), {})

  return (
    <TableRow className="assets">
      <TableCell variant="footer"/>
      <TableCell variant="footer"/>
      <TableCell variant="footer"/>
      <TableCell colSpan={4} variant="footer">
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
