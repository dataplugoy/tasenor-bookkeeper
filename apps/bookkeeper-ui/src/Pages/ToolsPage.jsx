import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import ToolsForPeriods from '../Components/ToolsForPeriods'
import ToolsForDatabases from '../Components/ToolsForDatabases'
import Catalog from '../Stores/Catalog'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'
import withRouter from '../Hooks/withRouter'

@withRouter
@withTranslation('translations')
@withStore
@withCatalog
@observer
class ToolsPage extends Component {

  render() {

    if (!this.props.store.isLoggedIn()) {
      return ''
    }
    const { db, tool } = this.props.params

    const pluginPanel = this.props.catalog.renderToolMainPanel(tool)
    if (pluginPanel) {
      return pluginPanel
    }

    if (tool === 'periods') {
      return <ToolsForPeriods db={db}/>
    } else {
      return <ToolsForDatabases />
    }
  }
}

ToolsPage.propTypes = {
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store),
  catalog: PropTypes.instanceOf(Catalog)
}
export default ToolsPage
