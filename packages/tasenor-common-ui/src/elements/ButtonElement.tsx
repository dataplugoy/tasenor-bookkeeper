import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@mui/material'
import { RenderingProps, isButtonElement } from '@dataplug/tasenor-common'
import { Renderer } from '../risp'

export const ButtonRenderer: Renderer = (props: RenderingProps) => {
  const { t } = useTranslation()
  const { element, values } = props
  if (!isButtonElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }
  const label = t(`label-${element.label}`)
  const requirements: string[] = element.requires ? (typeof element.requires === 'string' ? [element.requires] : element.requires) : []
  const allGood = requirements.filter(r => !values[r]).length === 0
  return <Button
      variant="outlined"
      disabled={!allGood}
      onClick={() => { element.triggerHandler && element.triggerHandler({ type: 'onClick' }, props) } }
    >
      {label}
    </Button>
}
