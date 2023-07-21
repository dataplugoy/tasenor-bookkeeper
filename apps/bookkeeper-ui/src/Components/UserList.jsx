import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer } from 'mobx-react'
import { withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import Cursor from '../Stores/Cursor'
import { List, ListItem, ListItemText } from '@mui/material'
import withRouter from '../Hooks/withRouter'

@withRouter
@withTranslation('translations')
@inject('store')
@observer
class UserList extends Component {

  onClickUser(user) {
    this.props.history.push(`/_/admin///users?user=${user.email}`)
  }

  render() {
    const { store, location } = this.props
    if (!store.isLoggedIn()) {
      return ''
    }
    const current = new URLSearchParams(location.search).get('user')
    return (
      <div>
        <List className="UserList">
          {
            this.props.store.users.map((user) => {
              const status = []
              if (user.disabled) status.push('[ DISABLED ]')
              if (user.config.admin) status.push('[ ADMIN ]')
              if (user.config.superuser) status.push('[ SUPERUSER ]')
              return (
              <ListItem id={`user-${user.email}`} key={user.email} button selected={current === user.email} onClick={() => this.onClickUser(user)}>
                <ListItemText primary={`${user.name} ${status.join(' ')}`} secondary={user.email} />
              </ListItem>
              )
            })
          }
        </List>
      </div>
    )
  }
}

UserList.propTypes = {
  cursor: PropTypes.instanceOf(Cursor),
  location: PropTypes.object,
  history: ReactRouterPropTypes.history,
  store: PropTypes.instanceOf(Store)
}

export default UserList
