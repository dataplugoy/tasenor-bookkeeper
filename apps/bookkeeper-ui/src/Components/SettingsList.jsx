import PropTypes from 'prop-types'
import { inject, observer } from 'mobx-react'
import { withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import ListComponent from './ListComponent'
import { withRouter } from 'react-router-dom'
import Catalog from '../Stores/Catalog'
import { haveCursor, haveSettings } from '@dataplug/tasenor-common'

@withTranslation('translations')
@withRouter
@inject('store')
@inject('catalog')
@observer
class SettingsList extends ListComponent {

  componentDidMount() {
    const cursor = haveCursor()
    cursor.selectPage('Settings', this)
  }

  getMenu() {
    const { store, catalog } = this.props
    const settings = haveSettings()

    let menu = [{
      page: 'settings',
      id: 'personal',
      title: 'Personal',
      disabled: () => false,
      default: true
    }, {
      page: 'settings',
      id: 'database',
      title: 'Current Database',
      disabled: () => !store.db,
    }]
    if (store.isAdmin) {
      menu = menu.concat({
        page: 'settings',
        id: 'system',
        title: 'System',
        disabled: () => false,
      })
    }

    // Add backend plugins.
    menu = menu.concat(settings.getPluginSettings().map(plugin => ({
      page: 'settings',
      id: plugin.code,
      title: plugin.title,
      disabled: () => false,
      visible: () => store.isAdmin, // Currently only admin is able to tune backend plugins.
    })))

    // Add UI plugins.
    const plugins = catalog.getPluginsWithSettings()
    menu = menu.concat(plugins.map(plugin => ({
      page: 'settings',
      id: plugin.code,
      title: plugin.title,
      disabled: () => !store.db
    })))

    return menu
  }

  render() {
    return this.renderMenu('Settings', 'section')
  }
}

SettingsList.propTypes = {
  store: PropTypes.instanceOf(Store),
  catalog: PropTypes.instanceOf(Catalog),
}

export default SettingsList
