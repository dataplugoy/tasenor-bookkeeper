import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Localize, Title } from '@tasenor/common-ui'
import { observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import Store from '../Stores/Store'
import { Box, Button, Typography, Avatar, List, ListItem } from '@mui/material'
import { Lock, NavigateNext } from '@mui/icons-material'
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
        <Box className="DashboardCompany">
          <Typography className="CompanyName" variant="h4" component="h2">{store.settings.get('companyName')}</Typography>
          <Typography className="CompanyCode" color="text.secondary">
            <Trans>Business ID</Trans>: {store.settings.get('companyCode')}
          </Typography>
        </Box>
        <Box className="DashboardPeriods">
          <Typography variant="h6" component="h3" className="DashboardHeading"><Trans>Periods</Trans></Typography>
          <List className="PeriodList" disablePadding>
          {store.database && store.database.periods.reverse().map((period, index) => {
            const letter = 'ABCDEFGHIJKLMNOPQRSTUVWZ'[index]
            return (
                <ListItem
                  id={`period-${period.start_date}-${period.end_date}`}
                  key={period.id}
                  disablePadding
                  selected={parseInt(periodId) === period.id}>
                  <Button id={letter} className="PeriodButton" color="inherit" onClick={() => this.selectPeriod(period)}>
                    <Avatar>{letter}</Avatar>
                    <span className="PeriodRange">
                      <Localize date={period.start_date} /><span className="dash">–</span><Localize date={period.end_date} />
                    </span>
                    {period.locked && <Lock className="PeriodLocked" fontSize="small" titleAccess={this.props.t('Locked')}/>}
                    <NavigateNext className="PeriodGo" fontSize="small"/>
                  </Button>
                </ListItem>
            )
          })}
          </List>
        </Box>
      </div>
    )
  }
}

DashboardPage.propTypes = {
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store),
}

export default DashboardPage
