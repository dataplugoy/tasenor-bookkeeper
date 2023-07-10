import React from 'react'
import { useTranslation } from 'react-i18next'
import { FormControlLabel, FormControl, FormLabel, RadioGroup, Radio, Grid } from '@mui/material'
import { RenderingProps, isNamedElement, isYesNoElement } from '@dataplug/tasenor-common'
import { Renderer } from '../risp'

/**
 * Rendering for boolean toggle element.
 */
export const YesNoRenderer: Renderer = (props: RenderingProps) => {
  const { element } = props

  const { t } = useTranslation()
  const label = 'label' in element ? element.label || '' : (isNamedElement(element) ? t(`label-${element.name}`) : '')
  const [value, setValue] = React.useState(isNamedElement(element) ? props.values[element.name] : null)

  if (!isYesNoElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }

  const yes: string = t('Yes')
  const no: string = t('No')

  return <FormControl component="fieldset">
    <FormLabel component="legend">{label}</FormLabel>
    <RadioGroup>
      <Grid>
        <FormControlLabel
          value="yes"
          label={yes}
          checked={value === true}
          control={<Radio/>}
          onChange={() => {
            setValue(true)
            element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value: true }, props)
          }}
        />
        <FormControlLabel
          value="no"
          label={no}
          checked={value === false}
          control={<Radio/>}
          onChange={() => {
            setValue(false)
            element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value: false }, props)
          }}
        />
      </Grid>
    </RadioGroup>
  </FormControl>
}
