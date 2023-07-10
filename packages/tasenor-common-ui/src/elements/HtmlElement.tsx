import React from 'react'
import { Typography } from '@mui/material'
import { RenderingProps, isHtmlElement } from '@dataplug/tasenor-common'
import { Renderer } from '../risp'

export const HtmlRenderer: Renderer = (props: RenderingProps) => {
  const { element } = props
  if (!isHtmlElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }
  const { html } = element
  return <Typography dangerouslySetInnerHTML={{ __html: html }}></Typography>
}
