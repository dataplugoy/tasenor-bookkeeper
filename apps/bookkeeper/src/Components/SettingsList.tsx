import React from 'react'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import Catalog from '../Stores/Catalog'
import { haveSettings } from '@tasenor/common'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'
import { ListMenu, ListMenuItem } from './ListMenu'

export type SettingsListProps = {
  store: Store
  catalog: Catalog
}

const SettingsList = observer(withCatalog(withStore((props: SettingsListProps): JSX.Element => {

  const { store, catalog } = props

  const settings = haveSettings()

  let menu: ListMenuItem[] = [{
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

  // Add system settings.
  if (store.isAdmin) {
    menu.push({
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

  return <ListMenu title="Settings" menu={menu} matchVar="section"/>
})))

export default SettingsList
