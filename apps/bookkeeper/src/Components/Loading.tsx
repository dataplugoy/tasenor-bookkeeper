import React from 'react'
import { Backdrop, CircularProgress, useTheme } from '@mui/material'

export interface LoadingProps {
  visible: boolean
}

const Loading = (props: LoadingProps) => {
  const theme = useTheme()
  return <Backdrop open={props.visible} style={{ zIndex: theme.zIndex.drawer + 1 }}>
    <CircularProgress color="inherit" />
  </Backdrop>
}

export default Loading
