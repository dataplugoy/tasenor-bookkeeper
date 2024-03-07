import React from 'react'
import { observer } from 'mobx-react'
import Catalog from '../Stores/Catalog'
import withCatalog from '../Hooks/withCatalog'
import { ListMenu } from './ListMenu'
import { useNav } from '@tasenor/common-ui'

export type ToolsListProps = {
  catalog: Catalog
}

const ToolsList = observer(withCatalog((props: ToolsListProps): JSX.Element => {
  const { catalog } = props
  const nav = useNav()
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
    disabled: () => !nav.db || nav.db === '_'
  }].concat(catalog.getToolMenu().map(menu => ({
    page: 'tools',
    id: menu.code,
    title: menu.title,
    disabled: () => menu.disabled
  })))

  return <ListMenu title="Tools" menu={menu} matchVar="tool"/>
}))

export default ToolsList
