import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import Store from '../Stores/Store'
import { IconButton, Localize } from '@dataplug/tasenor-common-ui'
import { Table, TableContainer, TableBody, TableCell, TableRow, TableHead, Chip, Button } from '@mui/material'
import ReactRouterPropTypes from 'react-router-prop-types'
import withRouter from '../Hooks/withRouter'
import withStore from '../Hooks/withStore'

const Locked = ({ lock }) => lock
  ? <Chip color="primary" label={<Trans>Locked</Trans>} />
  : <Chip color="secondary" label={<Trans>Unlocked</Trans>} />

Locked.propTypes = {
  lock: PropTypes.bool
}

@withRouter
@withTranslation('translations')
@withStore
@observer
class ToolsForPeriods extends Component {

  render() {
    const { store, history } = this.props
    if (!store.isLoggedIn()) {
      return ''
    }
    if (!store.database) {
      return ''
    }
    const goto = (period) => {
      history.push(`/${store.database.name}/txs/${period.id}`)
    }

    const periods = store.database.periods

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell variant="head"><Trans>#</Trans></TableCell>
              <TableCell variant="head"><Trans>Start Date</Trans></TableCell>
              <TableCell variant="head"><Trans>End Date</Trans></TableCell>
              <TableCell variant="head"><Trans>Locking</Trans></TableCell>
              <TableCell variant="head"></TableCell>
              <TableCell variant="head"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periods.reverse().map((period) => (
              <TableRow id={`Period ${period.start_date}`} key={period.id}>
                <TableCell>{period.id}</TableCell>
                <TableCell><Localize date={period.start_date} /></TableCell>
                <TableCell><Localize date={period.end_date} /></TableCell>
                <TableCell>
                  <Locked lock={!!period.locked} />
                </TableCell>
                <TableCell>
                  <IconButton className="LockPeriod" toggle={!!period.locked} onClick={() => period.lock()} title="lock-period" icon="lock"></IconButton>
                  <IconButton className="UnlockPeriod" toggle={!period.locked} onClick={() => period.unlock()} title="unlock-period" icon="unlock"></IconButton>
                </TableCell>
                <TableCell>
                  <Button variant="outlined" color="primary" size="small" onClick={() => goto(period)}><Trans>Proceed</Trans></Button>
                </TableCell>
              </TableRow>
            ))}
            {
              periods.length === 0 && <TableRow>
                <TableCell colSpan={6}><Trans>This is new database. You need to create an initial period for the database.</Trans></TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
      </TableContainer>
    )
  }
}

ToolsForPeriods.propTypes = {
  db: PropTypes.string,
  store: PropTypes.instanceOf(Store),
  history: ReactRouterPropTypes.history,
}
export default ToolsForPeriods
