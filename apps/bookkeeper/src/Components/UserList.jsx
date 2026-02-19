import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import Cursor from '../Stores/Cursor'
import { Chip, List, ListItem, ListItemButton, ListItemText } from '@mui/material'
import withRouter from '../Hooks/withRouter'
import withStore from '../Hooks/withStore'

@withRouter
@withTranslation('translations')
@withStore
@observer
class UserList extends Component {

  onClickUser(user) {
    this.props.navigate(`/_/admin/_/_/users?user=${user.email}`)
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
              if (user.disabled) status.push((<Chip key="disabled" variant="outlined" label={this.props.t('Disabled')}/>))
              if (user.config.admin) status.push(<Chip key="outlined" variant="outlined" label={this.props.t('Admin')}/>)
              if (user.config.superuser) status.push((<Chip key="superuser" variant="outlined" label={this.props.t('Superuser')}/>))
              return (
              <ListItemButton id={`user-${user.email}`} key={user.email} selected={current === user.email} onClick={() => this.onClickUser(user)}>
                <ListItemText primary={<>{user.name} {status}</>} secondary={user.email} />
              </ListItemButton>
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
  store: PropTypes.instanceOf(Store)
}

export default UserList
