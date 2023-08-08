import React from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@mui/material'

const SubTitle = (props) => {
  return (
    <Typography color="primary" variant="subtitle1">{props.children}</Typography>
  )

}

SubTitle.propTypes = {
  children: PropTypes.node,
}

export default SubTitle
