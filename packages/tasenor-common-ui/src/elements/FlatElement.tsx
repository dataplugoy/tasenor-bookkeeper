import React from 'react'
import { Box } from '@mui/material'
import { RenderingProps, isFlatElement, TasenorElement } from '@tasenor/common'
import { Renderer, RenderingEngine } from '../risp'

export const FlatRenderer: Renderer = (props: RenderingProps) => {
  const { element } = props
  if (!isFlatElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }
  return <>{
    element.elements.map((element: TasenorElement, idx) => (
      <Box key={idx} sx={{ mt: idx > 0 ? 1.5 : 0 }}>
        {RenderingEngine.render({ values: props.values, setup: props.setup, element })}
      </Box>)
    )
  }</>
}
