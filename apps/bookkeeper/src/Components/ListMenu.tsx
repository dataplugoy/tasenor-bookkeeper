import { Avatar, Box, List, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material'
import { haveCursor } from '@tasenor/common'
import { Note, Title, useNav } from '@tasenor/common-ui'
import React, { useEffect } from 'react'
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
  emptyMessage?: string
  store: Store
}

export const ListMenu = observer(withStore((props: ListMenuProps): JSX.Element => {
  const { title, menu, matchVar, store, emptyMessage } = props
  const params = useParams()
  const nav = useNav()
  const cursor = haveCursor()

  useEffect(() => {
    if (!store.isLoggedIn()) return
    cursor.selectPage(title, {
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
  }, [title])

  if (!store.isLoggedIn()) {
    return <></>
  }

  let idx = 0

  return <Box className={`${title.replace(/[^A-Za-z]/g, '')}List`}>
    <Title><Trans>{title}</Trans></Title>
    {
      menu.length > 0 && <List>
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
              onClick={() => nav.go({ side: menu.id }, true)}
            >
              <ListItemAvatar color="primary">
                <Avatar>{idx <= 10 ? idx % 10 : ''}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={<Trans>{menu.title}</Trans>} />
            </ListItemButton>)
        })
      }
      </List>
    }
    {
      menu.length === 0 && emptyMessage && <Note><>{emptyMessage}</></Note>
    }
  </Box>
}))
