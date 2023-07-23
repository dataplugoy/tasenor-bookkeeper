import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import Plugin from './Plugin'
import { Trans } from 'react-i18next'
import { inject } from 'mobx-react'
import Catalog from '../Stores/Catalog'
import { Button } from '@mui/material'
import Store from '../Stores/Store'
import withRouter from '../Hooks/withRouter'
import withStore from '../Hooks/withStore'

@withRouter
@inject('catalog')
@withStore
class Subscription extends Component {

  render() {
    const { plugin, subscription, catalog } = this.props

    let unsubscribeButton = <Button color="secondary" onClick={() => this.props.store.unsubscribe(plugin.code)}><Trans>Unsubscribe</Trans></Button>

    let expires

    if (!subscription) {
      expires = <Trans>No subscription info</Trans>
      unsubscribeButton = undefined
    } else {
      switch (subscription.model) {
        case 'COMPULSORY':
          expires = <Trans>Permanent</Trans>
          unsubscribeButton = undefined
          break
        case 'RECOMMENDED':
        case 'FREE':
          expires = <Trans>Does not expire</Trans>
          break
        case 'MONTHLY':
          expires = <><Trans>Expires</Trans>: {subscription.expires ? catalog.date2str(subscription.expires) : '-'}</>
          break
        case 'SINGLE':
          expires = <Trans>Does not expire</Trans>
          break
        default:
          expires = <><Trans>Expires</Trans>: <Trans>Not known</Trans></>
          break
      }
    }

    return (
      <Plugin key={plugin.code} subheader={<>{expires}{unsubscribeButton}</>} plugin={plugin} subscribed compact/>
    )
  }
}

Subscription.propTypes = {
  catalog: PropTypes.instanceOf(Catalog),
  store: PropTypes.instanceOf(Store),
  plugin: PropTypes.object,
  subscription: PropTypes.object,
  history: ReactRouterPropTypes.history
}

export default Subscription
