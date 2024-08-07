import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Localize, Title } from '@tasenor/common-ui'
import { observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import Store from '../Stores/Store'
import { Button, Typography, Avatar, List, ListItem } from '@mui/material'
import Panel from '../Components/Panel'
import { action } from 'mobx'
import { haveCursor } from '@tasenor/common'
import withStore from '../Hooks/withStore'
import withRouter from '../Hooks/withRouter'

@withRouter
@withTranslation('translations')
@withStore
@observer
class DashboardPage extends Component {

  componentDidUpdate() {
    if (!this.params || !this.props.store.database) {
      return
    }
    if (this.props.store.database.name !== this.params.db) {
      this.props.store.setDb(this.params.db)
    }
  }

  componentDidMount() {
    const cursor = haveCursor()
    cursor.selectPage('Dashboard', this)
  }

  @action
  selectDb(num) {
    const { dbs } = this.props.store
    num--
    if (num < dbs.length) {
      this.props.navigate(`/${dbs[num].name}`)
    }
  }

  @action
  selectPeriod(num) {
    if (!this.props.store.database) {
      return
    }
    let period
    if (typeof num === 'number') {
      const periods = this.props.store.database.periods.reverse()
      period = periods[num - 1]
    } else {
      this.props.store.setConfig('periodId', num.id)
      period = num
    }
    if (period) {
      this.props.navigate(`/${this.props.store.db}/txs/${period.id}`)
    }
  }

  keyText(cursor, key) {
    if (key >= '1' && key <= '9') {
      this.selectDb(parseInt(key))
    }
    key = key.toUpperCase()
    if (key >= 'A' && key <= 'Z') {
      this.selectPeriod(key.charCodeAt(0) - 64)
    }
  }

  render() {
    const { store } = this.props
    if (!store.isLoggedIn()) {
      return ''
    }
    if (!store.db) {
      return <div className="Dashboard">
        <Title><Trans>No Database Selected</Trans></Title>
        </div>
    }
    const { periodId } = this.props.params

    return (
      <div className="Dashboard">
        <Title><Trans>Database</Trans>: {store.db}</Title>
        <Panel title={<Trans>Company Info</Trans>}>
          <Trans>Business name</Trans>: {store.settings.get('companyName')}<br />
          <Trans>Business ID</Trans>: {store.settings.get('companyCode')}<br />
          <br />
          <Typography variant="h5" color="textSecondary"><Trans>Periods</Trans></Typography>
          <List className="PeriodList">
          {store.database && store.database.periods.reverse().map((period, index) => {
            const letter = 'ABCDEFGHIJKLMNOPQRSTUVWZ'[index]
            return (
                <ListItem
                  id={`period-${period.start_date}-${period.end_date}`}
                  key={period.id}
                  selected={parseInt(periodId) === period.id}>
                  <Button id={letter} onClick={() => this.selectPeriod(period)}>
                    <Avatar>{letter}</Avatar>&nbsp;
                    <Localize date={period.start_date} /> &mdash; <Localize date={period.end_date} />
                  </Button>
                </ListItem>
            )
          })}
          </List>
        </Panel>
      </div>
    )
  }
}

DashboardPage.propTypes = {
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store),
}

export default DashboardPage
