import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import Store from '../Stores/Store'
import Cursor from '../Stores/Cursor'
import UserList from '../Components/UserList'
import { Title } from '@dataplug/tasenor-common-ui'
import { withRouter } from 'react-router-dom'
import PluginList from '../Components/PluginList'

@withRouter
@withTranslation('translations')
@inject('store')
@observer
class AdminPage extends Component {

  render() {
    const { store, match } = this.props

    if (!store.isLoggedIn()) {
      return ''
    }

    const defaultTool = store.isSuperuser ? 'plugins' : 'users'
    const tool = match.params && match.params.tool ? match.params.tool : defaultTool

    if (tool === 'users') {
      return (
        <div>
          <Title><Trans>Users</Trans></Title>
          <UserList/>
        </div>
      )
    }
    if (tool === 'plugins') {
      return (
        <div>
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
  history: ReactRouterPropTypes.history,
  match: PropTypes.object,
  store: PropTypes.instanceOf(Store),
  t: PropTypes.func
}

export default AdminPage
