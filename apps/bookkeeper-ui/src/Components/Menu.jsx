import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer } from 'mobx-react'
import { Trans, withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import { Localize } from '@dataplug/tasenor-common-ui'
import LanguageSelector from './LanguageSelector'
import './Menu.css'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { Avatar, ButtonGroup } from '@mui/material'
import { AccountCircle, CalendarToday, NavigateBefore, NavigateNext, Storage } from '@mui/icons-material'
import { action } from 'mobx'
import Configuration from '../Configuration'
import { haveCursor } from '@dataplug/tasenor-common'

// TODO: This should be converted to function component.
// TODO: Once function component, use useNavigation from tasenor-common-ui.

@withTranslation('translations')
@inject('store')
@observer
class Menu extends Component {

  menu = [
    {
      title: '⌂',
      path: 'dashboard',
      visible: () => true,
      help: 'Dashboard',
      shortcut: '1',
      disabled: ({ notLoggedIn }) => notLoggedIn,
      action: () => this.handleSelect('dashboard')
    },
    {
      title: 'Transactions',
      path: 'txs',
      visible: () => true,
      help: 'View and edit transactions of the current period.',
      shortcut: '2',
      disabled: ({ db, periodId, notLoggedIn }) => !db || !periodId || notLoggedIn,
      action: () => this.handleSelect('txs')
    },
    {
      title: 'Reports',
      path: 'report',
      visible: () => true,
      help: 'Display various reports for the current period.',
      shortcut: '3',
      disabled: ({ db, periodId, notLoggedIn }) => !db || !periodId || notLoggedIn,
      action: () => this.handleSelect('report')
    },
    {
      title: 'Accounts',
      path: 'account',
      visible: () => true,
      help: 'View and edit accounting schema of this database.',
      shortcut: '4',
      disabled: ({ db, notLoggedIn }) => !db || notLoggedIn,
      action: () => this.handleSelect('account')
    },
    {
      title: 'Tools',
      path: 'tools',
      visible: () => true,
      help: 'A collection of various tools.',
      shortcut: '5',
      disabled: ({ notLoggedIn }) => notLoggedIn,
      action: () => this.handleSelect('tools')
    },
    {
      title: 'Data',
      path: 'data',
      help: 'Import data from various sources.',
      shortcut: '6',
      visible: () => true,
      disabled: ({ db, notLoggedIn }) => !db || notLoggedIn || notLoggedIn,
      action: () => this.handleSelect('data')
    },
    {
      title: 'Admin',
      path: 'admin',
      help: 'System administration.',
      shortcut: '7',
      visible: ({ notLoggedIn, isAdmin }) => !notLoggedIn && isAdmin,
      disabled: ({ notLoggedIn, isAdmin }) => notLoggedIn || !isAdmin,
      action: () => this.handleSelect('admin')
    },
    {
      title: 'Shop',
      path: 'shop',
      help: 'Plugin shop and subscription information.',
      shortcut: '7',
      visible: ({ notLoggedIn, isAdmin }) => !notLoggedIn && !isAdmin,
      disabled: ({ notLoggedIn }) => notLoggedIn,
      action: () => this.handleSelect('shop')
    },
    {
      title: 'Logout',
      visible: () => true,
      disabled: ({ notLoggedIn }) => notLoggedIn,
      action: () => this.handleSelect('logout')
    }
  ]

  @action
  update({ db, periodId }) {
    if (db === '_') {
      db = null
    }
    periodId = parseInt(periodId) || null
    this.props.store.setPeriod(db, periodId)
  }

  componentDidMount() {
    const cursor = haveCursor()

    cursor.registerMenu(this)
    this.props.store.fetchDatabases()
    this.props.store.fetchCurrentUser()
    this.update(this.props.match.params)
  }

  componentDidUpdate() {
    this.update(this.props.match.params)
  }

  keyCommand0() {
    this.handleSelect('settings')
  }

  keyCommand1() {
    return this.handleShortcut('1')
  }

  keyCommand2() {
    return this.handleShortcut('2')
  }

  keyCommand3() {
    return this.handleShortcut('3')
  }

  keyCommand4() {
    return this.handleShortcut('4')
  }

  keyCommand5() {
    return this.handleShortcut('5')
  }

  keyCommand6() {
    return this.handleShortcut('6')
  }

  keyCommand7() {
    return this.handleShortcut('7')
  }

  keyCommand8() {
    return this.handleShortcut('8')
  }

  keyCommand9() {
    return this.handleShortcut('9')
  }

  handleShortcut(key) {
    key = key.toUpperCase()
    const entries = this.menu.filter(e => e.shortcut === key)
    if (entries.length) {
      if (!this.isEnabled(entries[0])) {
        return { preventDefault: true }
      }
      entries[0].action()
      return { preventDefault: true }
    }
  }

  handleSelect(key) {
    const { store, history } = this.props
    const cursor = haveCursor()

    const periods = store.periods
    let url
    const [, db, tool, periodId, accountId, extras] = this.props.history.location.pathname.split('/')
    switch (key) {
      case 'logout':
        store.logout()
        history.push('/')
        break
      case 'admin':
      case 'dashboard':
      case 'txs':
      case 'account':
      case 'report':
      case 'tools':
      case 'data':
      case 'shop':
      case 'settings':
        url = '/' + (db || '_') + '/' + key
        if (periodId) {
          url += '/' + periodId
        }
        if (accountId) {
          url += '/' + accountId
        }
        cursor.resetSelected()
        history.push(url)
        break
      case 'next-period':
      case 'previous-period':
        if (db && periods && periods.length) {
          let index = periods.findIndex(p => p.id === parseInt(periodId))
          if (index < 0) {
            return
          }
          if (index > 0 && key === 'next-period') {
            index--
          } else if (index < periods.length - 1 && key === 'previous-period') {
            index++
          } else {
            return
          }
          url = '/' + db + '/' + tool + '/' + periods[index].id
          if (accountId) {
            url += '/' + accountId
          }
          if (extras) {
            if (!accountId) {
              url += '/'
            }
            url += '/' + extras
          }
          cursor.resetSelected()
          history.push(url)
        }
        break
      default:
        console.log('No idea how to handle', key)
    }
  }

  isEnabled(entry) {
    const { db, periodId, isAdmin } = this.props.store
    const notLoggedIn = !this.props.store.isLoggedIn()
    return !entry.disabled({ db, periodId, isAdmin, notLoggedIn })
  }

  isVisible(entry) {
    const { db, periodId, isAdmin } = this.props.store
    const notLoggedIn = !this.props.store.isLoggedIn()
    return entry.visible({ db, periodId, isAdmin, notLoggedIn })
  }

  renderMenu(entry, current) {
    if (!entry) {
      return ''
    }
    if (!current) {
      current = 'dashboard'
    }
    return <Button
      key={entry.title}
      id={`${entry.title}Menu`}
      className="button"
      disabled={!this.isEnabled(entry)}
      color={current === entry.path ? 'secondary' : 'primary'}
      variant="contained"
      onClick={() => entry.action()}
      title={this.props.t(entry.help) + (entry.shortcut ? ` (${Configuration.COMMAND_KEY} + ${entry.shortcut})` : '')}
    >
      <Trans>menu-{entry.title}</Trans>
    </Button>
  }

  render() {
    const [, , tool] = this.props.history.location.pathname.split('/')
    return (
      <div className="Menu">
        <AppBar position="static">
          <Toolbar>
            <IconButton edge="start" title={`${this.props.t('Go to Dashboard.')} (${Configuration.COMMAND_KEY} + 1)`} className="icon" color="inherit" aria-label="menu" onClick={() => (document.location = '/')}>
              <img className="logo" alt="logo" src="/logo.png"/>
            </IconButton>
            <span className="database">
              <Storage/> {this.props.store.db || <>&nbsp;&nbsp;&mdash;</>}
            </span>
            <span className="period">
              <CalendarToday/>
              {
                this.props.store.period &&
                <>
                  &nbsp;
                  <Localize date={this.props.store.period.start_date}/>
                  &nbsp;
                  <ButtonGroup variant="contained" color="primary">
                    <Button onClick={() => this.handleSelect('previous-period')}><NavigateBefore/></Button>
                    <Button onClick={() => this.handleSelect('next-period')}><NavigateNext/></Button>
                  </ButtonGroup>
                </>
              }
              {
                !this.props.store.period &&
                <>
                  &nbsp;&nbsp;&mdash;
                </>
              }
            </span>
            {
              this.menu.filter(entry => this.isVisible(entry)).map(entry => this.renderMenu(entry, tool))
            }
            <div className="language">
              <LanguageSelector />
            </div>
            {
              this.props.store.isLoggedIn() &&
              <div className="avatar" style={{ marginLeft: '1rem' }}>
                <Avatar alt={this.props.t('Edit Settings')}>
                  <IconButton id="Edit Settings" title={`${this.props.t('Edit Settings')} (${Configuration.COMMAND_KEY} + 0)`} color="inherit" onClick={() => this.handleSelect('settings')}>
                    <AccountCircle fontSize="large"/>
                  </IconButton>
                </Avatar>
              </div>
            }
          </Toolbar>
        </AppBar>
      </div>
    )
  }
}

Menu.propTypes = {
  store: PropTypes.instanceOf(Store),
  match: PropTypes.object,
  history: ReactRouterPropTypes.history.isRequired,
  t: PropTypes.any
}

export default Menu
