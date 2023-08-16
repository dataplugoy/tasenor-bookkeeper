import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import Store from '../Stores/Store'
import Cursor from '../Stores/Cursor'
import UserList from '../Components/UserList'
import { Title } from '@tasenor/common-ui'
import PluginList from '../Components/PluginList'
import withRouter from '../Hooks/withRouter'
import withStore from '../Hooks/withStore'

@withRouter
@withTranslation('translations')
@withStore
@observer
class AdminPage extends Component {

  render() {
    const { store, params } = this.props

    if (!store.isLoggedIn()) {
      return ''
    }

    const defaultTool = store.isSuperuser ? 'plugins' : 'users'
    const tool = params && params.tool ? params.tool : defaultTool

    if (tool === 'users') {
      return (
        <div className="UsersPage">
          <Title><Trans>Users</Trans></Title>
          <UserList/>
        </div>
      )
    }
    if (tool === 'plugins') {
      return (
        <div className="PluginsPage">
          <Title><Trans>Plugins</Trans></Title>
          <PluginList />
        </div>
      )
    }
    return <Title><Trans>Admin</Trans> TODO: {tool}</Title>
  }
}

AdminPage.propTypes = {
  cursor: PropTypes.instanceOf(Cursor),
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store),
  t: PropTypes.func
}

export default AdminPage
