import React from 'react'
import { Box, Card, CardContent, CardHeader } from '@mui/material'
import { RenderingProps, isBoxElement, TasenorElement } from '@dataplug/tasenor-common'
import { Renderer, RenderingEngine } from '../risp'

export const BoxRenderer: Renderer = (props: RenderingProps) => {
  const { element } = props
  if (!isBoxElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }
  return <Card variant="outlined">
    { ('title' in element) && <CardHeader title={element.title}/>}
    <CardContent>
      {
        element.elements.map((element: TasenorElement, idx) => (
          <Box key={idx} sx={{ mt: idx > 0 ? 1.5 : 0 }}>
            {RenderingEngine.render({ values: props.values, setup: props.setup, element })}
          </Box>)
        )
      }
    </CardContent>
  </Card>
}
