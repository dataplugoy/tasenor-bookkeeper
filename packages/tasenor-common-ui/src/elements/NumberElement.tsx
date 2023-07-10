import React from 'react'
import { useTranslation } from 'react-i18next'
import { InputAdornment, TextField } from '@mui/material'
import { RenderingProps, isNumberElement, isNamedElement } from '@dataplug/tasenor-common'
import { Renderer, RISPProvider } from '../risp'

/**
 * Rendering for text editing element.
 */
export const NumberRenderer: Renderer = (props: RenderingProps) => {
  const { element } = props

  const { t } = useTranslation()
  const label = (isNumberElement(element) && element.label) ? element.label : ((isNamedElement(element) && element.name) ? t(`label-${element.name}`) : '')
  const [value, setValue] = React.useState<number|null>(isNamedElement(element) ? props.values[element.name] as number || null : null)

  if (!isNumberElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }

  if (props.values[element.name] !== value) {
    setValue(props.values[element.name] as number)
  }

  return <TextField
    label={label}
    value={value}
    type="number"
    error={false}
    autoFocus
    InputProps={{
      endAdornment: <InputAdornment position="end">{element.unit || ''}</InputAdornment>
    }}
    onChange={(e) => {
      const value = e.target.value === '' ? null : parseFloat(e.target.value)
      setValue(value)
      element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value }, props)
    }}
    onFocus={() => RISPProvider.onFocus()}
    onBlur={() => RISPProvider.onBlur()}
    onKeyPress={() => null}
    onKeyUp={() => null}
    onKeyDown={() => null}
  />
}
