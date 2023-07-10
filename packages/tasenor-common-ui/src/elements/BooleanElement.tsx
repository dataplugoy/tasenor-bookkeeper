import React from 'react'
import { useTranslation } from 'react-i18next'
import { FormControlLabel, Checkbox } from '@mui/material'
import { isNamedElement, isBooleanElement, RenderingProps } from '@dataplug/tasenor-common'
import { Renderer } from '../risp'

/**
 * Rendering for boolean toggle element.
 */
export const BooleanRenderer: Renderer = (props: RenderingProps) => {
  const { element } = props

  const { t } = useTranslation()
  const label = 'label' in element ? element.label || '' : (isNamedElement(element) ? t(`label-${element.name}`) : '')
  const [value, setValue] = React.useState(isNamedElement(element) ? props.values[element.name] : null)

  if (!isBooleanElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }

  return <FormControlLabel
    control={
      <Checkbox
        checked={!!value}
        onChange={(e) => {
          setValue(e.target.checked)
          element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value: !!e.target.checked }, props)
        }}
        name={element.name}
        indeterminate={value === undefined || value === null}
      />
    }
    label={label}
  />
}
