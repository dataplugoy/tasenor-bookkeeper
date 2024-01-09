import { Asset, Currency, strRound } from '@tasenor/common'
import { Money } from '@tasenor/common-ui'
import { TableCell, TableRow } from '@mui/material'
import React, { Fragment } from 'react'
import { Trans } from 'react-i18next'

/**
 * View the stock situation for the given assets.
 */
export type TransactionStockProps = {
  values: Record<Asset, number>
  totals: Record<Asset, number>
  currency: Currency
}
export const TransactionStock = (props: TransactionStockProps): JSX.Element => {

  const { totals, values, currency } = props

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
              {strRound(amount)} x {asset}
              {' '}
              {amount ? <>(<Money currency={currency} cents={values[asset] / amount}/>&nbsp;/&nbsp;{asset})</> : ''}
              &nbsp;&nbsp;
            </Fragment>
          )
        }
      </TableCell>
    </TableRow>
  )
}
