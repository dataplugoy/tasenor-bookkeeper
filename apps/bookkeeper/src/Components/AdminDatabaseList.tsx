import React, { useEffect, useState } from 'react'
import { Trans } from 'react-i18next'
import Store from '../Stores/Store'
import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material'
import withStore from '../Hooks/withStore'
import { DbDataModel } from '@tasenor/common'
import { Localize, useNav } from '@tasenor/common-ui'

interface AdminDatabaseListProps {
  store: Store
}

const AdminDatabaseList = withStore((props: AdminDatabaseListProps): React.ReactNode => {

  const { store } = props
  const [dbs, setDbs] = useState<DbDataModel[]>([])
  const nav = useNav()

  useEffect(() => {
    store.request('/admin/db', 'GET').then(res => {
      setDbs(res)
    })
  }, [])

  return <List>
    {dbs.map(db =>
      <ListItemButton key={db.id} onClick={() => nav.go({ database: `${db.id}` })} selected={nav.get('database') === `${db.id}`}>
        <ListItemText>
          <Typography variant="subtitle1">{db.name}</Typography>
          <Trans>Creation Date</Trans>: <Localize date={db.created}/><br/>
          <Trans>Users</Trans>: {db.users.map(user => <Box key={user.user.id} component="span">
            {user.user.email} {user.config.isCreator ? '[CREATOR]' : ''}<> </>
          </Box>)}
        </ListItemText>
      </ListItemButton>
    )}
  </List>
})

export default AdminDatabaseList
