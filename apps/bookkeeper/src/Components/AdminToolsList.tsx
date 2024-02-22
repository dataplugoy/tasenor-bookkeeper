import React, {  } from 'react'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import withStore from '../Hooks/withStore'
import { ListMenu } from './ListMenu'

export type AdminToolsListProps = {
  store: Store
}

const AdminToolsList = observer(withStore((props: AdminToolsListProps): JSX.Element => {
  const { store } = props
  const menu = [{
    page: 'admin',
    id: 'plugins',
    title: 'Plugins',
    disabled: () => false,
    visible: () => store.isSuperuser,
    default: true
  }, {
    page: 'admin',
    id: 'users',
    title: 'Users',
    disabled: () => false,
  }, {
    page: 'admin',
    id: 'databases',
    title: 'Databases',
    disabled: () => false,
  }]

  return <ListMenu title="Admin Tools" menu={menu} matchVar="tool"/>
}))

export default AdminToolsList
