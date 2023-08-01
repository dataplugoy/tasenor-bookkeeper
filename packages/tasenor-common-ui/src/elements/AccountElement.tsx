import { useTranslation } from 'react-i18next'
import React from 'react'
import { AccountElement, AccountNumber, RenderingProps } from '@tasenor/common'
import { AccountSelector } from '../bookkeeper/AccountSelector'
import { Renderer } from '../risp/RenderingEngine'

export const AccountRenderer: Renderer = (props: RenderingProps<AccountElement>) => {

  const { t } = useTranslation()
  const { element, setup, values } = props
  const label = element.label ? element.label : t(`label-${element.name}`)
  const value = values[element.name]
  const [, setValue] = React.useState(value)

  return <AccountSelector
    label={label}
    value={value && setup.store.database && setup.store.database.getAccountByNumber(`${value}`) ? value as AccountNumber : '' as AccountNumber}
    onChange={(e) => {
      element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value: e || null }, props)
      values[element.name] = e || null
      setValue(e || null)
    }}
    preferred={element.preferred}
    filter={element.filter}
    accounts={setup.store.accounts}
  />
}
