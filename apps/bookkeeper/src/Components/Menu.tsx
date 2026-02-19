import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { Trans, useTranslation } from 'react-i18next'
import { Localize, useNav } from '@tasenor/common-ui'
import LanguageSelector from './LanguageSelector'
import './Menu.css'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { Avatar, ButtonGroup } from '@mui/material'
import { AccountCircle, CalendarToday, NavigateBefore, NavigateNext, Storage } from '@mui/icons-material'
import Configuration from '../Configuration'
import { error, haveCursor } from '@tasenor/common'
import withStore from '../Hooks/withStore'
import { useLocation } from 'react-router-dom'
import Store from '../Stores/Store'
import { runInAction } from 'mobx'

export interface MenuItemFnArgs {
  db: string
  periodId: string
  isAdmin: boolean
  notLoggedIn: boolean
}

export interface MenuItem {
  title: string
  path: string
  visible: (MenuItemFnArgs) => boolean
  help: string
  shortcut: string
  disabled: (MenuItemFnArgs) => boolean
  action: () => void
}

export interface MenuProps {
  store: Store
}

export const Menu = withStore(observer((props: MenuProps): React.ReactNode => {

  const [, setRefresh] = useState(false)
  const location = useLocation()
  const nav = useNav()
  const { t } = useTranslation()
  const { store } = props
  const cursor = haveCursor()

  let [, db, tool, periodId, accountId, extras]: (string | null | number)[] = location.pathname.split('/')

  useEffect(() => {
    // TODO: This is legacy and should be handled by each individual page accordingly.
    if (db === '_') {
      db = null
    }
    periodId = periodId ? parseInt(`${periodId}`) : null
    runInAction(() => {
      store.setPeriod(db, periodId).then(() => setRefresh((r) => !r))
      store.fetchDatabases().then(() => setRefresh((r) => !r))
      store.fetchCurrentUser().then(() => setRefresh((r) => !r))
    })
  }, [db, tool, periodId, accountId, extras])

  cursor.registerMenu({
    keyCommand0: () => {
      handleSelect('settings')
      return { preventDefault: true }
    },
    keyCommand1: () => {
      return handleShortcut('1')
    },
    keyCommand2: () => {
      return handleShortcut('2')
    },
    keyCommand3: () => {
      return handleShortcut('3')
    },
    keyCommand4: () => {
      return handleShortcut('4')
    },
    keyCommand5: () => {
      return handleShortcut('5')
    },
    keyCommand6: () => {
      return handleShortcut('6')
    },
    keyCommand7: () => {
      return handleShortcut('7')
    },
    keyCommand8: () => {
      return handleShortcut('8')
    },
    keyCommand9: () => {
      return handleShortcut('9')
    },
  })

  const handleShortcut = (key: string): { preventDefault: true } | undefined => {
    key = key.toUpperCase()
    const entries = menu.filter(e => e.shortcut === key)
    if (entries.length) {
      if (!isEnabled(entries[0])) {
        return { preventDefault: true }
      }
      entries[0].action()
      return { preventDefault: true }
    }
  }

  const menu: MenuItem[] = [
    {
      title: '⌂',
      path: 'dashboard',
      visible: () => true,
      help: 'Dashboard',
      shortcut: '1',
      disabled: ({ notLoggedIn }) => notLoggedIn,
      action: () => handleSelect('dashboard')
    },
    {
      title: 'Transactions',
      path: 'txs',
      visible: () => true,
      help: 'View and edit transactions of the current period.',
      shortcut: '2',
      disabled: ({ db, periodId, notLoggedIn }) => !db || !periodId || notLoggedIn,
      action: () => handleSelect('txs')
    },
    {
      title: 'Reports',
      path: 'report',
      visible: () => true,
      help: 'Display various reports for the current period.',
      shortcut: '3',
      disabled: ({ db, periodId, notLoggedIn }) => !db || !periodId || notLoggedIn,
      action: () => handleSelect('report')
    },
    {
      title: 'Accounts',
      path: 'account',
      visible: () => true,
      help: 'View and edit accounting schema of this database.',
      shortcut: '4',
      disabled: ({ db, notLoggedIn }) => !db || notLoggedIn,
      action: () => handleSelect('account')
    },
    {
      title: 'Tools',
      path: 'tools',
      visible: () => true,
      help: 'A collection of various tools.',
      shortcut: '5',
      disabled: ({ notLoggedIn }) => notLoggedIn,
      action: () => handleSelect('tools')
    },
    {
      title: 'Data',
      path: 'data',
      help: 'Import data from various sources.',
      shortcut: '6',
      visible: () => true,
      disabled: ({ db, notLoggedIn }) => !db || notLoggedIn || notLoggedIn,
      action: () => handleSelect('data')
    },
    {
      title: 'Admin',
      path: 'admin',
      help: 'System administration.',
      shortcut: '7',
      visible: ({ notLoggedIn, isAdmin }) => !notLoggedIn && !!isAdmin,
      disabled: ({ notLoggedIn, isAdmin }) => notLoggedIn || !isAdmin,
      action: () => handleSelect('admin')
    },
    {
      title: 'Shop',
      path: 'shop',
      help: 'Plugin shop and subscription information.',
      shortcut: '7',
      visible: ({ notLoggedIn, isAdmin }) => !notLoggedIn && !isAdmin,
      disabled: ({ notLoggedIn }) => notLoggedIn,
      action: () => handleSelect('shop')
    },
    {
      title: 'Logout',
      path: '',
      help: '',
      shortcut: '',
      visible: () => true,
      disabled: ({ notLoggedIn }) => notLoggedIn,
      action: () => handleSelect('logout')
    }
  ]

  const isEnabled = (entry: MenuItem): boolean => {
    const { db, periodId, isAdmin } = store
    const notLoggedIn = !store.isLoggedIn()
    return !entry.disabled({ db, periodId, isAdmin, notLoggedIn })
  }

  const isVisible = (entry: MenuItem): boolean => {
    const { db, periodId, isAdmin } = store
    const notLoggedIn = !store.isLoggedIn()
    return entry.visible({ db, periodId, isAdmin, notLoggedIn })
  }

  const renderMenu = (entry: MenuItem, current: string): React.ReactNode => {
    if (!entry) {
      return ''
    }
    if (!current) {
      current = 'dashboard'
    }
    return <Button
      key={entry.title}
      id={`${entry.title}Menu`}
      data-cy={`menu-${entry.title}`}
      className="button"
      disabled={!isEnabled(entry)}
      color={current === entry.path ? 'secondary' : 'primary'}
      variant="contained"
      onClick={() => entry.action()}
      title={t(entry.help) + (entry.shortcut ? ` (${Configuration.COMMAND_KEY} + ${entry.shortcut})` : '')}
    >
      <Trans>menu-{entry.title}</Trans>
    </Button>
  }

  const handleSelect = (key: string): void => {
    const periods = store.periods

    switch (key) {
      case 'logout':
        store.logout()
        nav.reset()
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
        cursor.resetSelected()
        nav.go({ main: key, side: '' })
        break
      case 'next-period':
      case 'previous-period':
        if (db && periods && periods.length) {
          let index = periods.findIndex(p => p.id === parseInt(periodId + ''))
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
          cursor.resetSelected()
          nav.go({ periodId: periods[index].id })
        }
        break
      default:
        error('No idea how to handle', key)
    }
  }

  return (
    <div className="Menu">
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" title={`${t('Go to Dashboard.')} (${Configuration.COMMAND_KEY} + 1)`} className="icon" color="inherit" aria-label="menu" onClick={() => (document.location = '/')}>
            <img className="logo" alt="logo" src="/logo.png"/>
          </IconButton>
          <span className="database">
            <Storage/> {store.db || <>&nbsp;&nbsp;&mdash;</>}
          </span>
          <span className="period">
            <CalendarToday/>
            {
              store.period &&
              <>
                &nbsp;
                <Localize date={store.period.start_date}/>
                &nbsp;
                <ButtonGroup variant="contained" color="primary">
                  <Button onClick={() => handleSelect('previous-period')}><NavigateBefore/></Button>
                  <Button onClick={() => handleSelect('next-period')}><NavigateNext/></Button>
                </ButtonGroup>
              </>
            }
            {
              !store.period &&
              <>
                &nbsp;&nbsp;&mdash;
              </>
            }
          </span>
          {
            menu.filter(entry => isVisible(entry)).map(entry => renderMenu(entry, tool as string))
          }
          <div className="language">
            <LanguageSelector />
          </div>
          {
            store.isLoggedIn() &&
            <div style={{ marginLeft: '1rem' }}>
              <Avatar alt={t('Edit Settings')}>
                <IconButton id="Edit Settings" title={`${t('Edit Settings')} (${Configuration.COMMAND_KEY} + 0)`} color="inherit" onClick={() => handleSelect('settings')}>
                  <AccountCircle fontSize="large"/>
                </IconButton>
              </Avatar>
            </div>
          }
        </Toolbar>
      </AppBar>
    </div>
  )

}))

export default Menu
