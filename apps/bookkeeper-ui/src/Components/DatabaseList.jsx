import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { inject, observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import Store from '../Stores/Store'
import { Title, Note } from '@dataplug/tasenor-common-ui'
import { Avatar, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material'
import ReactRouterPropTypes from 'react-router-prop-types'
import withRouter from '../Hooks/withRouter'

@withRouter
@withTranslation('translations')
@inject('store')
@observer
class DatabaseList extends Component {

  render() {
    const { store } = this.props
    if (!store.isLoggedIn()) {
      return ''
    }

    const current = store.db

    return (
      <div>
        <Title className="DatabasesPage"><Trans>Databases</Trans></Title>
        <Note showIf={store.dbs.length === 0}><Trans>There are no databases available.</Trans></Note>
        <List className="DatabaseList">
          {store.dbs.map((db, index) => {
            return (
              <ListItem id={index + 1} key={db.name} button selected={current === db.name} onClick={() => this.props.history.push(`/${db.name}`)}>
                <ListItemAvatar color="primary">
                  <Avatar>{index + 1}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={db.name}
                />
              </ListItem>
            )
          }
          )}
        </List>
      </div>
    )
  }
}

DatabaseList.propTypes = {
  store: PropTypes.instanceOf(Store),
  history: ReactRouterPropTypes.history,
}

export default DatabaseList
