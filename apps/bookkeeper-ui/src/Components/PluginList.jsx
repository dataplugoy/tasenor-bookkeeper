import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import Catalog from '../Stores/Catalog'
import { withRouter } from 'react-router-dom'
import { inject, observer } from 'mobx-react'
import Plugin from './Plugin'

@withRouter
@inject('catalog')
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
  location: PropTypes.object,
  history: ReactRouterPropTypes.history
}

export default PluginList
