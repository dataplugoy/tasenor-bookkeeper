import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import { Backdrop, CircularProgress } from '@mui/material'
import theme from '../theme'
import withStore from '../Hooks/withStore'

@withStore
@observer
class Loading extends Component {

  render() {
    return <Backdrop open={this.props.visible} style={{ zIndex: theme.zIndex.drawer + 1 }}>
      <CircularProgress color="inherit" />
    </Backdrop>
  }
}

Loading.propTypes = {
  always: PropTypes.bool,
  visible: PropTypes.bool,
  store: PropTypes.instanceOf(Store)
}

export default Loading
