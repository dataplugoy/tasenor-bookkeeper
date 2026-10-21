import { Box } from '@mui/material'
import React from 'react'

export const IconSpacer = () => {
  return <Box sx={{
    display: 'inline-block',
    height: '1.6rem',
    marginLeft: '0.75rem',
    marginRight: '0.75rem',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderColor: (theme) => theme.palette.divider,
    verticalAlign: 'middle'
  }} />
}
