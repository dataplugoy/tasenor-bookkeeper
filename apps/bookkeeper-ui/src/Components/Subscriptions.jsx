import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Catalog from '../Stores/Catalog'
import { observer } from 'mobx-react'
import { Title } from '@tasenor/common-ui'
import { Trans } from 'react-i18next'
import Subscription from './Subscription'
import withRouter from '../Hooks/withRouter'
import withCatalog from '../Hooks/withCatalog'

@withRouter
@withCatalog
@observer
class Subscriptions extends Component {

  render() {
    const data = this.props.catalog.subscriptionData

    return (
      <div>
        <Title><Trans>Current Subscriptions</Trans></Title>
        <div className="Subscriptions" style={{ display: 'flex', flexWrap: 'wrap' }}>
          {this.props.catalog.available.map((plugin) => {
            if (!data[plugin.id] || !data[plugin.id].subscription) {
              return undefined
            }
            if (!plugin.installedVersion) {
              return undefined
            }
            return <Subscription key={plugin.code} plugin={plugin} subscription={data[plugin.id] && data[plugin.id].subscription}/>
          })}
        </div>
      </div>
    )
  }
}

Subscriptions.propTypes = {
  catalog: PropTypes.instanceOf(Catalog),
  location: PropTypes.object,
}

export default Subscriptions
