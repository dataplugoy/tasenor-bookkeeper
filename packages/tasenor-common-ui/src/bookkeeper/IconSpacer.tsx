import { Box } from '@mui/material'
import React from 'react'

export const IconSpacer = () => {
  return <Box sx={{
    display: 'inline-block',
    height: '2rem',
    marginLeft: '1.5rem',
    marginRight: '1.5rem',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: (theme) => theme.palette.divider,
    transform: 'translateY(0.5rem)'
  }} />
}
