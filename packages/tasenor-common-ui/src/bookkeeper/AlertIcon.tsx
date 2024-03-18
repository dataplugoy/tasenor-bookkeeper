import { Alarm, NewReleases } from '@mui/icons-material'
import { Box } from '@mui/material'
import React from 'react'

export const AlertIcon = (): React.ReactNode => {
  return <Box component="span" sx={{ mx: 1, diplay: 'inline-block', color: 'error.main' }}>
    <NewReleases/>
  </Box>
}
