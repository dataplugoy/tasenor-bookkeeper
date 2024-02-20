import React from 'react'
import { observer } from 'mobx-react'
import { Trans } from 'react-i18next'
import Store from '../Stores/Store'
import UserList from '../Components/UserList'
import { Title } from '@tasenor/common-ui'
import PluginList from '../Components/PluginList'
import withStore from '../Hooks/withStore'
import AdminDatabaseList from '../Components/AdminDatabaseList'
import { useParams } from 'react-router-dom'
import { Box } from '@mui/material'

interface AdminPageProps {
  store: Store
}

const AdminPage = withStore(observer((props: AdminPageProps): JSX.Element => {
  const { store } = props
  const params = useParams()

  if (!store.isLoggedIn()) {
    return <></>
  }

  const defaultTool = store.isSuperuser ? 'plugins' : 'users'
  const tool = params && params.tool ? params.tool : defaultTool

  if (tool === 'users') {
    return (
      <Box className="UsersPage">
        <Title><Trans>Users</Trans></Title>
        <UserList/>
      </Box>
    )
  }

  if (tool === 'plugins') {
    return (
      <Box className="PluginsPage">
        <Title><Trans>Plugins</Trans></Title>
        <PluginList />
      </Box>
    )
  }

  if (tool === 'databases') {
    return (
      <Box className="DatabasePage">
        <Title><Trans>Databases</Trans></Title>
        <AdminDatabaseList />
      </Box>
    )
  }

  return <Title><><Trans>Admin</Trans> TODO: {tool}</></Title>
}))

export default AdminPage
