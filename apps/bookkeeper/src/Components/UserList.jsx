import React from 'react'
import { observer } from 'mobx-react'
import { useTranslation } from 'react-i18next'
import { Chip, List, ListItemButton, ListItemText } from '@mui/material'
import { useNav } from '@tasenor/common-ui'
import withStore from '../Hooks/withStore'

const UserList = withStore(observer((props) => {
  const { store } = props
  const { t } = useTranslation()
  const nav = useNav()

  if (!store.isLoggedIn()) {
    return ''
  }

  const current = nav.get('user')

  return (
    <div>
      <List className="UserList">
        {
          store.users.map((user) => {
            const status = []
            if (user.disabled) status.push((<Chip key="disabled" variant="outlined" label={t('Disabled')}/>))
            if (user.config.admin) status.push(<Chip key="outlined" variant="outlined" label={t('Admin')}/>)
            if (user.config.superuser) status.push((<Chip key="superuser" variant="outlined" label={t('Superuser')}/>))
            return (
            <ListItemButton id={`user-${user.email}`} key={user.email} selected={current === user.email} onClick={() => nav.go({ user: user.email })}>
              <ListItemText primary={<>{user.name} {status}</>} secondary={user.email} />
            </ListItemButton>
            )
          })
        }
      </List>
    </div>
  )
}))

export default UserList
