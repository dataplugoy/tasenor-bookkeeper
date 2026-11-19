import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import TransactionTable from '../Components/TransactionTable'
import Drafts from '../Components/Drafts'
import Store from '../Stores/Store'
import withStore from '../Hooks/withStore'
import withRouter from '../Hooks/withRouter'

@withRouter
@withStore
@observer
class TransactionsPage extends Component {

  componentDidMount() {
    const { db, periodId, accountId } = this.props.params
    if (accountId) {
      this.props.store.setAccount(db, periodId, accountId)
    } else {
      this.props.store.setPeriod(db, periodId)
    }
  }

  componentDidUpdate() {
    const { db, periodId, accountId } = this.props.params
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
    const { db, periodId } = this.props.params
    return (
      <div style={{ margin: '1rem' }}>
        <Drafts db={db} periodId={parseInt(periodId)}/>
        <TransactionTable/>
      </div>
    )
  }
}

TransactionsPage.propTypes = {
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store)
}

export default TransactionsPage
