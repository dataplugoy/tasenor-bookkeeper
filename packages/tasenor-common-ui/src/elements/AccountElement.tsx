import { useTranslation } from 'react-i18next'
import React from 'react'
import { AccountElement, RenderingProps } from '@tasenor/common'
import { AccountSelector } from '../bookkeeper/AccountSelector'
import { Renderer } from '../risp/RenderingEngine'

export const AccountRenderer: Renderer = (props: RenderingProps<AccountElement>) => {

  const { t } = useTranslation()
  const { element, setup, values } = props
  const label = element.label ? element.label : t(`label-${element.name}`)
  const value = values[element.name]
  const [, setValue] = React.useState(value)
  const account = (value && setup.store.database && setup.store.database.getAccountByNumber(`${value}`)) ? setup.store.database.getAccountByNumber(`${value}`) : null

  return <AccountSelector
    label={label}
    value={account}
    onChange={(e) => {
      const val = e ? e.number : null
      element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value: val }, props)
      values[element.name] = val
      setValue(val)
    }}
    preferred={element.preferred}
    filter={element.filter}
    accounts={setup.store.accounts}
  />
}
