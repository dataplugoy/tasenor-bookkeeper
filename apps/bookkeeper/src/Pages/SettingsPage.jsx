import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import Catalog from '../Stores/Catalog'
import Profile from '../Components/Profile'
import PluginSettings from '../Components/PluginSettings'
import SystemSettings from '../Components/SystemSettings'
import DatabaseSettings from '../Components/DatabaseSettings'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'
import withRouter from '../Hooks/withRouter'

@withRouter
@withTranslation('translations')
@withStore
@withCatalog
@observer
class SettingsPage extends Component {

  render() {
    const { store, params } = this.props

    if (!store.isLoggedIn()) {
      return ''
    }
    const { section } = params

    if (!section || section === 'personal') {
      return <Profile />
    } else if (section === 'database') {
      return <DatabaseSettings/>
    } else if (section === 'system') {
      return <SystemSettings/>
    } else {
      return <PluginSettings plugin={section}/>
    }
  }
}

SettingsPage.propTypes = {
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store),
  catalog: PropTypes.instanceOf(Catalog)
}
export default SettingsPage
