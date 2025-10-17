import React from 'react'
import { useTranslation } from 'react-i18next'
import { TextField } from '@mui/material'
import { RenderingProps, isTextElement, isNamedElement } from '@tasenor/common'
import { Renderer, RISPProvider } from '../risp'

/**
 * Rendering for text editing element.
 */
export const TextRenderer: Renderer = (props: RenderingProps) => {
  const { element } = props

  const { t } = useTranslation()
  const label = (isTextElement(element) && element.label) ? element.label : ((isNamedElement(element) && element.name) ? t(`label-${element.name}`) : '')
  const [value, setValue] = React.useState<string>(isNamedElement(element) ? props.values[element.name] as string || '' : '')

  if (!isTextElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }

  if (props.values[element.name] !== value) {
    setValue(props.values[element.name] as string)
  }

  return <TextField
    label={label}
    multiline={!!element.multiline}
    minRows={element.multiline ? 2 : 1}
    name={element.name}
    value={value || ''}
    error={false}
    autoFocus
    fullWidth
    autoComplete="off"
    onChange={(e) => {
      setValue(e.target.value)
      element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value: e.target.value }, props)
    }}
    onFocus={() => RISPProvider.onFocus()}
    onBlur={() => RISPProvider.onBlur()}
    onKeyUp={() => null}
    onKeyDown={() => null}
  />
}
