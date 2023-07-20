import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { List, ListItem, Avatar, ListItemAvatar, ListItemText } from '@mui/material'
import { Trans } from 'react-i18next'
import Store from '../Stores/Store'
import { Title } from '@dataplug/tasenor-common-ui'

// TODO: Convert to function component and use new useNavigation hook.
class ListComponent extends Component {

  url(comp, page) {
    const { db, periodId, accountId } = this.props.match.params
    return '/' + (db || '_') + '/' + comp + '/' + (periodId || '') + '/' + ((accountId) || '') + '/' + page
  }

  keyText(cursor, key) {
    const menu = this.getMenu()
    const { history } = this.props
    if (key >= '0' && key <= '9') {
      const index = key === '0' ? 10 : parseInt(key)
      let idx = 0
      for (let i = 0; i < menu.length; i++) {
        if (menu[i].visible && !menu[i].visible()) continue
        idx++
        if (idx === index) {
          if (!menu[i].disabled()) {
            history.push(this.url(menu[i].page, menu[i].id))
            break
          }
        }
      }
      return { preventDefault: true }
    }
  }

  renderMenu(title, matchVar) {
    const { store, match, history } = this.props
    if (!store.isLoggedIn()) {
      return ''
    }
    const menu = this.getMenu()
    let idx = 0

    return (
      <div className={`${title.replace(/[^A-Za-z]/g, '')}List`}>
        <Title><Trans>{title}</Trans></Title>
        <List>
          {
            menu.map((menu) => {
              if (menu.visible && !menu.visible()) {
                return <span key={menu.id}/>
              }
              idx++
              return (
                <ListItem
                  id={menu.cssId ? menu.cssId : (idx <= 10 ? `${idx % 10}` : '')}
                  key={menu.id}
                  button
                  selected={match.params[matchVar] === `${menu.id}` || (!match.params[matchVar] && menu.default)}
                  disabled={menu.disabled()}
                  onClick={() => history.push(this.url(menu.page, menu.id))}
                >
                  <ListItemAvatar color="primary">
                    <Avatar>{idx <= 10 ? idx % 10 : ''}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={<Trans>{menu.title}</Trans>} />
                </ListItem>)
            })
          }
        </List>
      </div>
    )
  }
}

ListComponent.propTypes = {
  match: PropTypes.object,
  history: ReactRouterPropTypes.history.isRequired,
  store: PropTypes.instanceOf(Store),
}

export default ListComponent
