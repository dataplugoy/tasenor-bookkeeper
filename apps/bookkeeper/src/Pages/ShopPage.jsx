import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Catalog from '../Stores/Catalog'
import { observer } from 'mobx-react'
import Plugin from '../Components/Plugin'
import { Title } from '@tasenor/common-ui'
import { Trans } from 'react-i18next'
import withRouter from '../Hooks/withRouter'
import withCatalog from '../Hooks/withCatalog'
import withStore from '../Hooks/withStore'

@withRouter
@withCatalog
@withStore
@observer
class ShopPage extends Component {

  render() {
    const data = this.props.catalog.subscriptionData
    if (Math.max(...this.props.catalog.available.map(p => p.id)) < Math.min(...Object.keys(data).map(e => parseInt(e)))) {
      this.props.store.addError('Note: there seems to be both local plugin IDs and Tasenor Server plugin IDs mixed.')
    }

    return (
      <div className="Shop">
        <Title><Trans>Available Plugins</Trans></Title>
        <div className="PluginList" style={{ display: 'flex', flexWrap: 'wrap' }}>
          {this.props.catalog.available.map((plugin) => {
            if (data[plugin.id] && data[plugin.id].subscription) {
              return undefined
            }
            if (!plugin.installedVersion) {
              return undefined
            }
            return <Plugin key={plugin.code} plugin={plugin} price={data[plugin.id] && data[plugin.id].price} />
          })}
        </div>
      </div>
    )
  }
}

ShopPage.propTypes = {
  catalog: PropTypes.instanceOf(Catalog),
  location: PropTypes.object,
}

export default ShopPage
