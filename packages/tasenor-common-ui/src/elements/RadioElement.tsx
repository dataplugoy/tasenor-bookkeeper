import React from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material'
import { RenderingProps, isRadioElement, isNamedElement } from '@dataplug/tasenor-common'
import { Renderer } from '../risp'

/**
 * Rendering for radio group element.
 */
export const RadioRenderer: Renderer = (props: RenderingProps) => {
  const { element } = props

  const { t } = useTranslation()
  const label = (isRadioElement(element) && element.label) ? element.label : ((isNamedElement(element) && element.name) ? t(`label-${element.name}`) : '')
  const [value, setValue] = React.useState(isNamedElement(element) ? props.values[element.name] || '' : '')

  if (!isRadioElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup>
        {Object.entries(element.options).map(([k, v]) =>
          <FormControlLabel
            key={k}
            value={v}
            control={<Radio />}
            label={k}
            checked={value === v}
            onChange={() => {
              setValue(v)
              element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value: v }, props)
            }}/>
        )}
      </RadioGroup>
    </FormControl>
  )
}
