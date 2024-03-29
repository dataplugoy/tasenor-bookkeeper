import React from 'react'
import { Typography } from '@mui/material'

export interface NoteProps {
  children: React.ReactNode
  className?: string
  showIf?: boolean
}

export const Note = (props: NoteProps) => {
  const { children, className, showIf } = props
  if (showIf !== undefined && !showIf) {
    return <></>
  }
  return (
    <Typography className={className || 'Note'} sx={{ m: 2 }} color="error" align="center" variant="h6">
      {children}
    </Typography>
  )
}
