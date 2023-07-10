import React from 'react'
import { Currency, haveCatalog } from '@dataplug/tasenor-common'

export type MoneyProps = {
  cents: number
  currency?: Currency
  signed?: boolean
}

/**
 * Format a number presenting cents as a money as per currency.
 * @param props
 * @returns
 */
export const Money = (props: MoneyProps) => {
  const catalog = haveCatalog()
  const str = catalog.money2str(props.cents, props.currency, props.signed)
  return (<span className="Money" style={{ whiteSpace: 'nowrap' }} dangerouslySetInnerHTML={{ __html: str }}></span>)
}
