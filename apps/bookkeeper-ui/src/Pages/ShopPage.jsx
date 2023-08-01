import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Catalog from '../Stores/Catalog'
import { observer } from 'mobx-react'
import Plugin from '../Components/Plugin'
import { Title } from '@tasenor/common-ui'
import { Trans } from 'react-i18next'
import withRouter from '../Hooks/withRouter'
import withCatalog from '../Hooks/withCatalog'

@withRouter
@withCatalog
@observer
class ShopPage extends Component {

  render() {
    const data = this.props.catalog.subscriptionData
    return (
      <div className="Shop">
        <Title><Trans>Available Plugins</Trans></Title>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
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
