import React from 'react'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import Catalog from '../Stores/Catalog'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'
import { ListMenu } from './ListMenu'

export type ToolsListProps = {
  store: Store
  catalog: Catalog
}

const ToolsList = observer(withStore(withCatalog((props: ToolsListProps): JSX.Element => {
  const { catalog, store } = props
  const menu = [{
    page: 'tools',
    id: 'databases',
    title: 'Databases',
    disabled: () => false,
    default: true
  }, {
    page: 'tools',
    id: 'periods',
    title: 'Periods',
    disabled: () => !store.db
  }].concat(catalog.getToolMenu().map(menu => ({
    page: 'tools',
    id: menu.code,
    title: menu.title,
    disabled: () => menu.disabled
  })))

  return <ListMenu title="Tools" menu={menu} matchVar="tool"/>
})))

export default ToolsList
