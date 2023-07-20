import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { inject, observer } from 'mobx-react'
import TransactionTable from '../Components/TransactionTable'
import Store from '../Stores/Store'

@inject('store')
@observer
class TransactionsPage extends Component {

  componentDidMount() {
    const { db, periodId, accountId } = this.props.match.params
    if (accountId) {
      this.props.store.setAccount(db, periodId, accountId)
    } else {
      this.props.store.setPeriod(db, periodId)
    }
  }

  componentDidUpdate() {
    const { db, periodId, accountId } = this.props.match.params
    if (accountId) {
      this.props.store.setAccount(db, periodId, accountId)
    } else {
      this.props.store.setPeriod(db, periodId)
    }
  }

  render() {
    if (!this.props.store.isLoggedIn()) {
      return ''
    }
    return (
      <div style={{ margin: '1rem' }}>
        <TransactionTable/>
      </div>
    )
  }
}

TransactionsPage.propTypes = {
  match: PropTypes.object,
  store: PropTypes.instanceOf(Store)
}

export default TransactionsPage
