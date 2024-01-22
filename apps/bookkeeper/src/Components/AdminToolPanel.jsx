import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import { Dialog, IconButton, Title } from '@tasenor/common-ui'
import Store from '../Stores/Store'
import Catalog from '../Stores/Catalog'
import RegisterForm from './RegisterForm'
import { TextField } from '@mui/material'
import { haveCursor } from '@tasenor/common'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'
import withRouter from '../Hooks/withRouter'

@withTranslation('translations')
@withStore
@withCatalog
@withRouter
@observer
class AdminToolPanel extends Component {

  state = {
    showCreateUserDialog: false,
    showDeleteUserDialog: false,
    emailInput: ''
  }

  componentDidMount() {
    const cursor = haveCursor()
    this.props.store.getUsers()
    cursor.registerTools(this)
  }

  componentWillUnmount() {
    const cursor = haveCursor()
    cursor.registerTools(null)
  }

  async onDeleteUser(user) {
    if (user.email !== this.state.emailInput) {
      this.props.store.addError(this.props.t('Email was not given correctly.'))
    } else {
      if (await this.props.store.deleteUser(user)) {
        this.props.store.getUsers()
        this.props.store.addMessage(this.props.t('User deleted permanently.'))
      }
    }
  }

  onRegister({ user, name, password, email }) {
    return this.props.store.request('/admin/user', 'POST', { user, name, password, email })
      .then((res) => {
        if (res) {
          this.setState({ showCreateUserDialog: false })
          this.props.store.getUsers()
          this.props.store.addMessage(this.props.t('User created successfully.'))
        } else {
          this.props.store.addError(this.props.t('User creation failed.'))
        }
      })
      .catch(() => {
        this.setState({ showCreateUserDialog: false })
      })
  }

  keyIconA() {
    this.setState({ showCreateUserDialog: true })
    return { preventDefault: true }
  }

  keyIconX() {
    this.setState({ showDeleteUserDialog: true, emailInput: '' })
    return { preventDefault: true }
  }

  render() {
    const { store, params } = this.props

    if (!store.isLoggedIn()) {
      return ''
    }

    const defaultTool = store.isSuperuser ? 'plugins' : 'users'
    const tool = params && params.tool ? params.tool : defaultTool

    if (tool === 'users') {

      const selectedUser = this.props.location.search && new URLSearchParams(this.props.location.search).get('user')
      const user = selectedUser && this.props.store.getUser(selectedUser)

      return (
        <div className="ToolPanel AdminToolPanel">
          <Title className="UserTools"><Trans>User Tools</Trans></Title>

          <IconButton id="create-user" shortcut="A" pressKey="IconA" disabled={this.state.showCreateUserDialog} title="create-user" icon="user-plus"></IconButton>
          <IconButton id="delete-user" shortcut="X" pressKey="IconX" disabled={!selectedUser} title="delete-user" icon="trash"></IconButton>

          <Dialog
            className="CreateUser"
            noActions
            wider
            title={<Trans>Create User</Trans>}
            isVisible={this.state.showCreateUserDialog}
            onClose={() => this.setState({ showCreateUserDialog: false })}
          >
            <RegisterForm
              onCancel={() => this.setState({ showCreateUserDialog: false })}
              onRegister={({ user, name, password, email }) => this.onRegister({ user, name, password, email })}
              />
          </Dialog>

          <Dialog
            className="DeleteUser"
            title={<Trans>Delete User</Trans>}
            isVisible={this.state.showDeleteUserDialog}
            onClose={() => this.setState({ showDeleteUserDialog: false })}
            onConfirm={() => this.onDeleteUser(user)}
            wider
          >
              <Trans>Deleting the user is irreversible!</Trans><br />
              <Trans>Please type in the email</Trans> <b>{user && user.email}</b>
              <TextField
                name="deleted-user-email"
                fullWidth
                label={<Trans>Email</Trans>}
                value={this.state.nameInput}
                onChange={(event) => (this.setState({ emailInput: event.target.value }))}
              />
          </Dialog>
        </div>
      )
    }

    const loadPlugins = async () => {
      await this.props.catalog.updatePluginList()
    }

    const rebuildPlugins = async () => {
      await this.props.catalog.rebuildPluginList()
      document.location.reload()
    }

    const upgradePlugins = async () => {
      await this.props.catalog.upgradePlugins()
      document.location.reload()
    }

    const resetPlugins = async () => {
      await this.props.catalog.resetPluginList()
      document.location.reload()
    }

    if (tool === 'plugins') {
      return (
        <div className="ToolPanel AdminToolPanel">
          <Title><Trans>Plugin Tools</Trans></Title>
          <IconButton id="refresh-plugins" onClick={() => loadPlugins()} title="refresh-plugins" icon="refresh"></IconButton>
          <IconButton id="upgrade-plugins" onClick={() => upgradePlugins()} title="upgrade-plugins" icon="update"></IconButton>
          <IconButton id="rebuild-plugins" onClick={() => rebuildPlugins()} title="rebuild-plugins" icon="build"></IconButton>
          <IconButton id="reset-plugins" onClick={() => resetPlugins()} title="reset-plugins" icon="trash"></IconButton>
        </div>
      )
    }

    return <Title><Trans>No Tools</Trans></Title>
  }
}

AdminToolPanel.propTypes = {
  catalog: PropTypes.instanceOf(Catalog),
  location: PropTypes.object,
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store),
  t: PropTypes.func
}

export default AdminToolPanel
