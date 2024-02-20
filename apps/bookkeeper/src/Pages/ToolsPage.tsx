import React from 'react'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import ToolsForPeriods from '../Components/ToolsForPeriods'
import ToolsForDatabases from '../Components/ToolsForDatabases'
import Catalog from '../Stores/Catalog'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'
import { useParams } from 'react-router-dom'

interface ToolsPageProps {
  store: Store
  catalog: Catalog
}

const ToolsPage = withCatalog(withStore(observer((props: ToolsPageProps): JSX.Element => {
  const { store, catalog } = props
  const params = useParams()

  if (!store.isLoggedIn()) {
    return <></>
  }

  const { db, tool } = params

  const pluginPanel = catalog.renderToolMainPanel(tool)
  if (pluginPanel) {
    return pluginPanel
  }

  if (tool === 'periods') {
    return <ToolsForPeriods db={db}/>
  } else {
    return <ToolsForDatabases />
  }
})))

export default ToolsPage
