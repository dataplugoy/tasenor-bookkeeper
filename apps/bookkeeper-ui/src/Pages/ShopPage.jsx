import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import Catalog from '../Stores/Catalog'
import { withRouter } from 'react-router-dom'
import { inject, observer } from 'mobx-react'
import Plugin from '../Components/Plugin'
import { Title } from '@dataplug/tasenor-common-ui'
import { Trans } from 'react-i18next'

@withRouter
@inject('catalog')
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
  history: ReactRouterPropTypes.history
}

export default ShopPage
