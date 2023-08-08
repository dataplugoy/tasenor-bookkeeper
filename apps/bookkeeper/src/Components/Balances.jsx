import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import BalanceTable from '../Components/BalanceTable'
import Store from '../Stores/Store'
import { Title } from '@tasenor/common-ui'
import withStore from '../Hooks/withStore'

@withTranslation('translations')
@withStore
@observer
class Balances extends Component {

  render() {
    if (!this.props.store.isLoggedIn()) {
      return ''
    }

    return (
      <div style={{ margin: '1rem' }}>
        <Title className="TransactionsPage"><Trans>Account Balances</Trans></Title>
        <BalanceTable balances={this.props.store.balances}/>
      </div>
    )
  }
}

Balances.propTypes = {
  store: PropTypes.instanceOf(Store)
}

export default Balances
