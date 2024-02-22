import { Avatar, Box, List, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material'
import { haveCursor } from '@tasenor/common'
import { Title, useNav } from '@tasenor/common-ui'
import React from 'react'
import { Trans } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { observer } from 'mobx-react'
import withStore from '../Hooks/withStore'
import Store from '../Stores/Store'

export interface ListMenuItem {
  page: string
  id: string
  title: string
  visible?: () => boolean
  disabled: () => boolean
  cssId?: string
  default?: boolean
}

export type ListMenuProps = {
  title: string
  menu: ListMenuItem[]
  matchVar: string
  store: Store
}

export const ListMenu = observer(withStore((props: ListMenuProps): JSX.Element => {
  const { title, menu, matchVar, store } = props
  const params = useParams()
  const nav = useNav()
  const cursor = haveCursor()

  if (!store.isLoggedIn()) {
    return <></>
  }

  cursor.selectPage('Tools', {
    keyText: (cursor, key) => {
      if (key >= '0' && key <= '9') {
        const index = key === '0' ? 10 : parseInt(key)
        let idx = 0
        for (let i = 0; i < menu.length; i++) {
          const m: ListMenuItem = menu[i]
          if (m.visible && !m.visible()) continue
          idx++
          if (idx === index) {
            if (!m.disabled()) {
              nav.go({ side: m.id })
              break
            }
          }
        }
        return { peventDefault: true }
      }
    }
  })

  let idx = 0

  return <Box className={`${title.replace(/[^A-Za-z]/g, '')}List`}>
    <Title><Trans>{title}</Trans></Title>
    <List>
    {
      menu.map((menu) => {
        if (menu.visible && !menu.visible()) {
          return <span key={menu.id}/>
        }
        idx++
        return (
          <ListItemButton
            id={menu.cssId ? menu.cssId : (idx <= 10 ? `${idx % 10}` : '')}
            key={menu.id}
            data-cy={`list-${menu.title}`}
            selected={params[matchVar] === `${menu.id}` || (!params[matchVar] && menu.default)}
            disabled={menu.disabled()}
            onClick={() => nav.go({ side: menu.id })}
          >
            <ListItemAvatar color="primary">
              <Avatar>{idx <= 10 ? idx % 10 : ''}</Avatar>
            </ListItemAvatar>
            <ListItemText primary={<Trans>{menu.title}</Trans>} />
          </ListItemButton>)
      })
    }
    </List>
  </Box>
}))
