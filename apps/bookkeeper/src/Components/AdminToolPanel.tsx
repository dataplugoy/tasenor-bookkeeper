import React, { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Dialog, IconButton, RISPProvider, Title, useNav } from '@tasenor/common-ui'
import Store from '../Stores/Store'
import Catalog from '../Stores/Catalog'
import RegisterForm from './RegisterForm'
import { Autocomplete, Box, TextField } from '@mui/material'
import { Email, ID, UserDataModel, haveCursor } from '@tasenor/common'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'

interface PluginAdminToolPanelProps {
  catalog: Catalog
}

const PluginAdminToolPanel = withCatalog((props: PluginAdminToolPanelProps): JSX.Element => {
  const { catalog } = props
  const loadPlugins = async () => {
    await catalog.updatePluginList()
  }

  const rebuildPlugins = async () => {
    await catalog.rebuildPluginList()
    document.location.reload()
  }

  const upgradePlugins = async () => {
    await catalog.upgradePlugins()
    document.location.reload()
  }

  const resetPlugins = async () => {
    await catalog.resetPluginList()
    document.location.reload()
  }

  return <Box>
    <Title><Trans>Plugin Tools</Trans></Title>
    <IconButton id="refresh-plugins" onClick={() => loadPlugins()} title="refresh-plugins" icon="refresh"></IconButton>
    <IconButton id="upgrade-plugins" onClick={() => upgradePlugins()} title="upgrade-plugins" icon="update"></IconButton>
    <IconButton id="rebuild-plugins" onClick={() => rebuildPlugins()} title="rebuild-plugins" icon="build"></IconButton>
    <IconButton id="reset-plugins" onClick={() => resetPlugins()} title="reset-plugins" icon="trash"></IconButton>
  </Box>
})

interface UserAdminToolPanelProps {
  store: Store
  selected: Email
}

const UserAdminToolPanel = withStore((props: UserAdminToolPanelProps): JSX.Element => {

  const { store, selected } = props
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false)
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const { t } = useTranslation()

  const user = selected && store.getUser(selected)

  useEffect(() => {
    const cursor = haveCursor()
    store.getUsers()
    cursor.registerTools({
      keyIconA: () => {
        setShowCreateUserDialog(true)
        return { preventDefault: true }
      },
      keyIconX: () => {
        setShowDeleteUserDialog(true)
        setEmailInput('')
        return { preventDefault: true }
      }
    })
    return () => {
      cursor.registerTools(null)
    }
  }, [])

  const onRegister = ({ user, name, password, email }) => {
    return store.request('/admin/user', 'POST', { user, name, password, email })
      .then((res) => {
        setShowCreateUserDialog(false)
        if (res) {
          store.getUsers()
          store.addMessage(t('User created successfully.'))
        } else {
          store.addError(t('User creation failed.'))
        }
      })
  }

  const onDeleteUser = async (user) => {
    if (user.email !== emailInput) {
      store.addError(t('Email was not given correctly.'))
    } else {
      if (await store.deleteUser(user)) {
        store.getUsers()
        store.addMessage(t('User deleted permanently.'))
      }
    }
  }

  return (
    <Box>
      <Title className="UserTools"><Trans>User Tools</Trans></Title>

      <IconButton id="create-user" shortcut="A" pressKey="IconA" disabled={showCreateUserDialog} title="create-user" icon="user-plus"></IconButton>
      <IconButton id="delete-user" shortcut="X" pressKey="IconX" disabled={!selected} title="delete-user" icon="trash"></IconButton>

      <Dialog
        className="CreateUser"
        noActions
        wider
        title={<Trans>Create User</Trans>}
        isVisible={showCreateUserDialog}
        onClose={() => setShowCreateUserDialog(false)}
      >
        <RegisterForm
          onCancel={() => setShowCreateUserDialog(false)}
          onRegister={({ user, name, password, email }) => onRegister({ user, name, password, email })}
          />
      </Dialog>

      <Dialog
        className="DeleteUser"
        title={<Trans>Delete User</Trans>}
        isVisible={showDeleteUserDialog}
        onClose={() => setShowDeleteUserDialog(false)}
        onConfirm={() => onDeleteUser(user)}
        wider
      >
          <Trans>Deleting the user is irreversible!</Trans><br />
          <Trans>Please type in the email</Trans> <b>{user && user.email}</b>
          <TextField
            name="deleted-user-email"
            fullWidth
            label={<Trans>Email</Trans>}
            value={emailInput}
            onChange={(event) => (setEmailInput(event.target.value))}
          />
      </Dialog>
    </Box>
  )
})

interface DatabaseAdminToolPanelProps {
  store: Store
  selected: ID
}

const DatabaseAdminToolPanel = withStore((props: DatabaseAdminToolPanelProps): JSX.Element => {
  const { store, selected } = props
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const { t } = useTranslation()
  const [user, setUser] = useState<UserDataModel|null>(null)
  const nav = useNav()

  useEffect(() => {
    const cursor = haveCursor()
    store.getUsers()
    cursor.registerTools({
      keyIconA: () => {
        setShowAddUserDialog(true)
        return { preventDefault: true }
      },
    })
    return () => {
      cursor.registerTools(null)
    }
  }, [])

  const onAddUser = () => {
    if (user) {
      store.request(`/admin/user/${user.email}/databases`, 'POST', { database: selected }).then((res) => {
        if (res) {
          store.addMessage(t('User added to database.'))
          nav.go({ database: null})
        }
      })
    }
  }

  return <Box>
    <Title><Trans>Database Tools</Trans></Title>
    <IconButton id="add-user" shortcut="A" pressKey="IconA" disabled={!selected} title="add-user" icon="user-plus"></IconButton>

    <Dialog
      wider
      title={<Trans>Add User for Database</Trans>}
      isVisible={showAddUserDialog}
      onClose={() => setShowAddUserDialog(false)}
      onConfirm={() => onAddUser()}
      >
      <Autocomplete
        autoFocus
        options={store.users}
        getOptionLabel={(option: UserDataModel) => `${option.email}`}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            {option.email}
          </Box>
        )}
        onFocus={() => RISPProvider.onFocus()}
        onBlur={() => RISPProvider.onBlur()}
        value={user}
        onChange={(_, option) => setUser(option as UserDataModel)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('Email')}
            inputProps={{
              ...params.inputProps,
              autoComplete: 'off'
            }}
          />
        )}
      />
    </Dialog>
  </Box>
})

interface AdminToolPanelProps {
  store: Store
}

const AdminToolPanel = withStore((props: AdminToolPanelProps): React.ReactNode => {
  const { store } = props
  const nav = useNav()

  if (!store.isLoggedIn()) {
    return ''
  }

  const defaultTool = store.isSuperuser ? 'plugins' : 'users'
  const side = nav.get('side') || defaultTool

  if (side === 'users') return <Box className="ToolPanel AdminToolPanel"><UserAdminToolPanel selected={nav.get('user') as Email}/></Box>
  if (side === 'databases') return <Box className="ToolPanel AdminToolPanel"><DatabaseAdminToolPanel selected={nav.get('database')}/></Box>
  if (side === 'plugins') return <Box className="ToolPanel AdminToolPanel"><PluginAdminToolPanel/></Box>

  return <Title><Trans>No Tools</Trans></Title>
})

export default AdminToolPanel
