import React from 'react'
import { Box, Typography } from '@mui/material'

export interface TitleProps {
  className?: string
  children: JSX.Element
}

export const Title = ({ children, className }: TitleProps) => {
  return <Box
    className={className ? `${className} Title` : 'Title'}
    data-cy={`page-${className}`}
    sx={{ paddingLeft: '2rem', marginBottom: '1rem', borderBottom: 1, borderColor: 'divider' }}
  >
    <Typography className="text" variant="h5">{children}</Typography>
  </Box>
}
