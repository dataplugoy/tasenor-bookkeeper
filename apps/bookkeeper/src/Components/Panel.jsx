import React from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import { PropTypes } from 'prop-types'

const Panel = ({ children, title }) => (
  <Card className="Panel-card" sx={{ m: 2 }}>
    {
      title && <CardHeader title={<Typography variant="h6">{title}</Typography>} />
    }
    <CardContent>
      {children}
    </CardContent>
  </Card>
)

Panel.propTypes = {
  children: PropTypes.node,
  title: PropTypes.node,
}

export default Panel
