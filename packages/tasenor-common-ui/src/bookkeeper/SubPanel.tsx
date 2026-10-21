import React from 'react'
import { Card, CardContent, Typography } from '@mui/material'

export interface SubPanelProps {
  className?: string
  children: JSX.Element | JSX.Element[]
}

export const SubPanel = (props: SubPanelProps) => {
  return (
    <Card className={props.className || 'SubPanel'} variant="outlined" sx={{ m: 2 }}>
      <CardContent>
        <Typography variant="body1" component="div">
          {props.children}
        </Typography>
      </CardContent>
    </Card>
  )
}
