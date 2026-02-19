import React, { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import { Box, Chip, List, ListItemButton, ListItemText, Typography } from '@mui/material'
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
  const { t } = useTranslation()

  useEffect(() => {
    store.request('/admin/db', 'GET').then(res => {
      setDbs(res)
    })
  }, [nav.get('database')])

  return <List>
    {dbs.map(db =>
      <ListItemButton key={db.id} onClick={() => nav.go({ database: db.name })} selected={nav.get('database') === db.name}>
        <ListItemText>
          <Typography variant="subtitle1">{db.name}</Typography>
          <Trans>Creation Date</Trans>: <Localize date={db.created}/><br/>
          {
            db.users && <>
              <Trans>Users</Trans>: {db.users.map(user => <Box key={user.user.id} component="span">
              {user.user.email} {user.config.isCreator ? <Chip variant="outlined" label={t('Creator')}/> : ''}<> </>
              </Box>)}
            </>
          }
          {
            !db.users && <><Trans>No users</Trans></>
          }
        </ListItemText>
      </ListItemButton>
    )}
  </List>
})

export default AdminDatabaseList
