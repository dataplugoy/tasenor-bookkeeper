import React from 'react'
import { Alert } from '@mui/material'
import { RenderingProps, isMessageElement } from '@dataplug/tasenor-common'
import { Renderer } from '../risp'

export const MessageRenderer: Renderer = (props: RenderingProps) => {
  const { element } = props
  if (!isMessageElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }
  const { severity, text } = element
  return <Alert severity={severity}>{text}</Alert>
}
