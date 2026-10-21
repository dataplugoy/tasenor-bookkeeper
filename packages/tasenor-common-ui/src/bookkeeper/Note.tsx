import React from 'react'
import { Box } from '@mui/material'
import { InfoOutlined } from '@mui/icons-material'

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
    <Box
      className={className || 'Note'}
      sx={{
        m: 2,
        px: 2,
        py: 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        borderRadius: 1,
        border: 1,
        borderColor: 'divider',
        borderLeft: 3,
        borderLeftColor: 'secondary.main',
        color: 'text.secondary',
        fontSize: '0.95rem',
        lineHeight: 1.5,
      }}
    >
      <InfoOutlined fontSize="small" sx={{ color: 'secondary.main', mt: '2px' }}/>
      <Box>{children}</Box>
    </Box>
  )
}
