import React from 'react'
import { Typography } from '@mui/material'

export interface TitleProps {
  className?: string
  children: JSX.Element
}

export const Title = ({ children, className }: TitleProps) => {
  return <div
    className={className ? `${className} Title` : 'Title'}
    style={{ paddingLeft: '2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
  >
    <Typography className="text" variant="h5">{children}</Typography>
  </div>
}
