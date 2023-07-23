import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Catalog from '../Stores/Catalog'
import { observer } from 'mobx-react'
import Plugin from './Plugin'
import withRouter from '../Hooks/withRouter'
import withCatalog from '../Hooks/withCatalog'

@withRouter
@withCatalog
@observer
class PluginList extends Component {

  render() {
    return (
      <div className="PluginList" style={{ display: 'flex', flexWrap: 'wrap' }}>
        {this.props.catalog.index.slice().sort((a, b) => (a.title < b.title ? -1 : (a.title > b.title ? 1 : 0))).map((plugin) => <Plugin admin key={plugin.code} plugin={plugin} />)}
      </div>
    )
  }
}

PluginList.propTypes = {
  catalog: PropTypes.instanceOf(Catalog),
  location: PropTypes.object
}

export default PluginList
