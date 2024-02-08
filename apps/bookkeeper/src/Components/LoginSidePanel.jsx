import React from 'react'
import { PropTypes } from 'prop-types'
import { Box } from '@mui/material'

const LoginSidePanel = () => {
  return (
    <Box>
      <img style={{ width: '100%' }} alt="Tasenor" src="/tasenor.png"/>
    </Box>
  )
}

LoginSidePanel.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any,
  showIf: PropTypes.bool
}

export default LoginSidePanel
