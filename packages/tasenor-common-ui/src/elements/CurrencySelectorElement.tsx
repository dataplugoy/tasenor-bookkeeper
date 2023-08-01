import { Trans, useTranslation } from 'react-i18next'
import { MenuItem, TextField } from '@mui/material'
import React from 'react'
import { CurrencyElement, RenderingProps } from '@tasenor/common'
import { Renderer } from '../risp/RenderingEngine'

export const CurrencySelectorRenderer: Renderer = (props: RenderingProps<CurrencyElement>) => {

  const { t } = useTranslation()
  const { element, setup, values } = props

  const label = element.label ? element.label : t(`label-${element.name}`)
  const value: string = values[element.name] as string || 'Not Selected'
  const [, setValue] = React.useState<string>(value)
  const options = setup.store.catalog.getCurrencies()

  return <TextField
    select
    label={label}
    value={value}
    onChange={(e) => {
      const newValue = e.target.value === 'Not Selected' ? null : e.target.value
      element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value: newValue }, props)
      values[element.name] = newValue
      setValue(e.target.value)
    }}
  >
  <MenuItem value="Not Selected" key="Not Selected"><Trans>Select</Trans></MenuItem>
    {options.map(currency => <MenuItem value={currency} key={currency}>{currency}</MenuItem>)}
  </TextField>
}
