import React, { Component } from 'react'
import { Snackbar, IconButton, Alert, Box } from '@mui/material'
import { Close } from '@mui/icons-material'
import { observer } from 'mobx-react'
import { PropTypes } from 'prop-types'
import Store from '../Stores/Store'
import Loading from './Loading'
import withStore from '../Hooks/withStore'

@withStore
@observer
class Messages extends Component {

  removeMessage(message) {
    this.props.store.removeMessage(message)
  }

  renderMessage(message) {
    return (
      <div className={`Message ${message.type}`}>
        {message.text}
        <IconButton size="small" aria-label="close" color="inherit" onClick={() => this.removeMessage(message)}>
          <Close fontSize="small" />
        </IconButton>
      </div>
    )
  }

  render() {
    const { messages, loading } = this.props.store
    return (
      <div>
        <Loading visible={loading} />
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          open={messages.length > 0}
          data-cy="snackbar"
        >
          <Box>
          {
            messages.map(message =>
              <Alert key={message.id} data-cy={`message-${message.type}`} variant="filled" elevation={6} severity={message.type}>
                {this.renderMessage(message)}
              </Alert>
            )
          }
          </Box>
        </Snackbar>
      </div>
    )
  }
}

Messages.propTypes = {
  store: PropTypes.instanceOf(Store)
}

export default Messages
