import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer, inject } from 'mobx-react'
import BalanceModel from '../Models/BalanceModel'
import Cursor from '../Stores/Cursor'
import { Money } from '@dataplug/tasenor-common-ui'
import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import { Trans, withTranslation } from 'react-i18next'
import withRouter from '../Hooks/withRouter'

const BalanceLine = withRouter(inject('cursor')(observer(
  ({ navigate, cursor, balance, index }) => {

    const onClick = (idx, url) => {
      cursor.setComponent('Balances.balances')
      cursor.setIndex(idx, { noScroll: true })
      navigate(url)
    }

    return (
      <TableRow
        className="BalanceLine"
        key={balance.account_id}
        id={balance.getId()}
        hover
        selected={balance.selected}
        onClick={() => onClick(index, balance.getUrl())}
      >
        <TableCell className="number">
          {balance.account.number}
        </TableCell>
        <TableCell align="left" className="account">
          {balance.account.name}
        </TableCell>
        <TableCell align="right" className="balance">
          <Money currency={balance.account.currency} cents={balance.total} />
        </TableCell>
      </TableRow>
    )
  }
)))

BalanceLine.propTypes = {
  balance: PropTypes.instanceOf(BalanceModel),
  cursor: PropTypes.instanceOf(Cursor),
  index: PropTypes.number,
}

@withTranslation('translations')
@observer
class BalanceTable extends Component {

  render() {

    return (
      <TableContainer component={Paper}>
        <Table className="BalanceTable" size="medium" padding="none">
          <TableHead>
            <TableRow>
              <TableCell variant="head" align="center"><Trans>#</Trans></TableCell>
              <TableCell variant="head" align="left"><Trans>Name</Trans></TableCell>
              <TableCell variant="head" align="right"><Trans>Balance</Trans></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.props.balances.map((balance, idx) => <BalanceLine key={balance.account_id} index={idx} balance={balance} />)}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }
}

BalanceTable.propTypes = {
  balances: PropTypes.arrayOf(PropTypes.instanceOf(BalanceModel)),
}

export default BalanceTable
