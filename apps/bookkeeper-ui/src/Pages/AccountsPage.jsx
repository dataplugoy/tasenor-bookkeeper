import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { inject, observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import AccountTable from '../Components/AccountTable'
import Store from '../Stores/Store'
import { Title } from '@dataplug/tasenor-common-ui'
import { haveCursor } from '@dataplug/tasenor-common'

@withTranslation('translations')
@inject('store')
@observer
class AccountsPage extends Component {

  componentDidMount() {
    const cursor = haveCursor()
    cursor.selectPage('Accounts', this)
  }

  render() {
    if (!this.props.store.isLoggedIn()) {
      return ''
    }
    const { favorite, asset, liability, equity, revenue, expense, profit, search } = this.props.store.tools.accounts
    const types = []
      .concat(!asset ? ['ASSET'] : [])
      .concat(!liability ? ['LIABILITY'] : [])
      .concat(!equity ? ['EQUITY'] : [])
      .concat(!revenue ? ['REVENUE'] : [])
      .concat(!expense ? ['EXPENSE'] : [])
      .concat(!profit ? ['PROFIT_PREV', 'PROFIT'] : [])
    const s = search && search.toUpperCase()
    const accounts = this.props.store.accounts.filter(acc => (
      (!favorite || acc.FAVOURITE) &&
      (types.includes(acc.type)) &&
      (!s || acc.name.toUpperCase().indexOf(s) >= 0 || acc.number === s)
    ))

    return (
      <div className="AccountsPage">
        <Title><Trans>Account scheme</Trans></Title>
        <AccountTable accounts={accounts} headings={this.props.store.headings} />
      </div>
    )
  }
}

AccountsPage.propTypes = {
  store: PropTypes.instanceOf(Store)
}

export default AccountsPage
