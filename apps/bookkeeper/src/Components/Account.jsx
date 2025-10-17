import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { action, runInAction } from 'mobx'
import { Trans, withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import AccountModel from '../Models/AccountModel'
import { Dialog, Localize, SubPanel, Title } from '@tasenor/common-ui'
import { Link, Button, MenuItem, TextField } from '@mui/material'
import Labeled from './Labeled'
import SubTitle from './SubTitle'
import { Lock, LockOpen } from '@mui/icons-material'
import { haveKnowledge } from '@tasenor/common'
import withStore from '../Hooks/withStore'
import withRouter from '../Hooks/withRouter'

@withRouter
@withTranslation('translations')
@withStore
@observer
class Account extends Component {

  state = {
    editDialogIsOpen: false,
    deleteIsOpen: false,
    changed: false,
    new: null,
    accountName: '',
    accountNumber: '',
    accountType: '',
    accountCode: ''
  }

  componentDidMount() {
    const { db, periodId, accountId } = this.props.params
    if (accountId) {
      this.props.store.setAccount(db, periodId, accountId)
    } else if (periodId) {
      this.props.store.setPeriod(db, periodId)
    }
  }

  componentDidUpdate() {
    this.componentDidMount()
  }

  @action.bound
  onSubmitAccount() {
    let model
    if (this.state.new) {
      model = new AccountModel(this.props.store.database, {
        name: this.state.accountName,
        number: this.state.accountNumber,
        type: this.state.accountType,
        data: {
          code: this.state.accountCode || null
        }
      })
    } else {
      runInAction(() => {
        model = this.props.store.account
        model.name = this.state.accountName
        model.number = this.state.accountNumber
        model.type = this.state.accountType
        model.data.code = this.state.accountCode || null
      })
    }
    model.save()
      .then(() => {
        this.setState({ editDialogIsOpen: false, accountName: '', accountNumber: '', accountType: '', accountCode: '' })
        this.props.store.fetchAccounts(this.props.store.database.name)
      })
  }

  @action.bound
  onDeleteAccount() {
    const { db, periodId } = this.props.params
    this.props.store.account.delete()
      .then(() => this.props.navigate(`/${db}/account/${periodId || ''}`))
  }

  renderDeleteDialog() {
    const account = this.props.store.account
    return <Dialog
      className="DeleteAccountDialog"
      title={<Trans>Delete this account?</Trans>}
      isVisible={this.state.deleteIsOpen}
      onClose={() => this.setState({ deleteIsOpen: false })}
      onConfirm={() => this.onDeleteAccount()}>
      <i>{account.number} {account.name}</i><br/>
    </Dialog>
  }

  renderEditDialog() {
    const knowledge = haveKnowledge()
    const vatTable = knowledge.vatTable()

    const t = this.props.t
    const database = this.props.store.database
    const isValid = () => this.state.accountNumber &&
      this.state.accountName &&
      this.state.accountType &&
      (!this.state.new || (database && !database.hasAccount(this.state.accountNumber)))

    const numberAlreadyExists = !!(this.state.changed && this.state.new && this.state.accountNumber && database.hasAccount(this.state.accountNumber))
    const numberMissing = (this.state.changed && !this.state.accountNumber)
    const nameMissing = (this.state.changed && !this.state.accountName)
    const typeMissing = (this.state.changed && !this.state.accountType)
    const taxTypes = {}
    switch (this.state.accountType) {
      case 'EXPENSE':
        vatTable.filter(e => e.name.startsWith('expense')).forEach(e => {
          taxTypes[e.id] = `${t(e.name)} (${e.value}%)`
        })
        break
      case 'REVENUE':
        vatTable.filter(e => e.name.startsWith('income')).forEach(e => {
          taxTypes[e.id] = `${t(e.name)} (${e.value}%)`
        })
        break
      default:
    }

    return <Dialog
      isValid={() => isValid()}
      className="EditAccount"
      title={this.state.new ? <Trans>Create New Account</Trans> : <Trans>Edit Account</Trans>}
      isVisible={this.state.editDialogIsOpen}
      onClose={() => this.setState({ editDialogIsOpen: false })}
      onConfirm={() => this.onSubmitAccount()}>
      <TextField
        fullWidth
        autoComplete="off"
        label={<Trans>Account Number</Trans>}
        name="account_number"
        error={numberAlreadyExists || numberMissing}
        helperText={numberAlreadyExists ? t('Account number exists.') : (numberMissing ? t('Account number is required.') : '')}
        value={this.state.accountNumber}
        onChange={(e) => this.setState({ changed: true, accountNumber: e.target.value })}
      />
      <TextField
        fullWidth
        autoComplete="off"
        label={<Trans>Account Name</Trans>}
        name="account_name"
        error={nameMissing}
        helperText={nameMissing ? t('Account name is required.') : ''}
        value={this.state.accountName}
        onChange={(e) => this.setState({ changed: true, accountName: e.target.value })}
      />
      <TextField
        select
        fullWidth
        autoComplete="off"
        label={<Trans>Account Type</Trans>}
        name="account_type"
        className="account-type-dropdown"
        error={typeMissing}
        value={this.state.accountType}
        onChange={(e) => this.setState({ changed: true, accountType: e.target.value, accountCode: '' })}
        helperText={typeMissing ? t('Account type is required.') : ''}
      >
        <MenuItem value="">&nbsp;</MenuItem>
        {['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].map(o => <MenuItem value={o} key={o}>{t(o)}</MenuItem>)}
      </TextField>
      <TextField
        select
        autoComplete="off"
        fullWidth
        label={<Trans>Code</Trans>}
        name="code"
        className="account-code-dropdown"
        value={this.state.accountCode}
        onChange={(e) => this.setState({ changed: true, accountCode: e.target.value })}
        disabled={Object.keys(taxTypes).length === 0}
      >
        <MenuItem value="">&nbsp;</MenuItem>
        {Object.entries(taxTypes).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
      </TextField>
    </Dialog>
  }

  onClickCreateNew() {
    const account = this.props.store.account
    const nextNumber = (number) => {
      if (!account.database.hasAccount(number)) {
        return number
      }
      return nextNumber((parseInt(number) + 1).toString())
    }
    const number = account ? nextNumber(account.number) : ''
    this.setState({
      editDialogIsOpen: true,
      new: true,
      changed: false,
      accountName: '',
      accountNumber: number,
      accountType: '',
      accountCode: ''
    })
  }

  onClickEdit() {
    const account = this.props.store.account
    this.setState({
      editDialogIsOpen: true,
      new: false,
      changed: false,
      accountName: account.name,
      accountNumber: account.number,
      accountType: account.type,
      accountCode: account.data.code || ''
    })
  }

  canChange() {
    if (this.state.new) {
      return true
    }
    const account = this.props.store.account
    if (!account || !account.periods) {
      return false
    }
    return account.periods.reduce((prev, cur) => prev && !cur.locked && !cur.entries, true)
  }

  render() {
    if (!this.props.store.isLoggedIn()) {
      return ''
    }
    const knowledge = haveKnowledge()
    const { account, db } = this.props.store
    const { t } = this.props
    const codeTranslate = code => {
      let tr = t(`income-${code}`)
      if (tr !== code) return tr
      tr = t(`expense-${code}`)
      if (tr !== code) return tr
      return t(`tax-${code}`)
    }

    return (
      <div>
        <Title><Trans>Accounts</Trans></Title>
        <SubPanel>
          <Button id="CreateNewAccount" variant="outlined" color="secondary" onClick={() => this.onClickCreateNew()}><Trans>Create New Account</Trans></Button>
        </SubPanel>
        {
          account &&
          <SubPanel className="AccountInfoPanel">
            <Labeled className="name" title={<Trans>Account Name</Trans>}>{account.name}</Labeled>
            <Labeled className="number" title={<Trans>Account Number</Trans>}>{account.number}</Labeled>
            <Labeled className="type" title={<Trans>Account Type</Trans>}><Trans>{account.type}</Trans></Labeled>
            {account.data.code !== null && account.data.code !== undefined
              ? <>
                <Labeled title={<Trans>Account Code</Trans>}>{codeTranslate(account.data.code)} ({knowledge.vat(account.data.code)}%)</Labeled>
              </>
              : ''}
            <br/>
            <br/>
            <Button id="DeleteAccount" variant="outlined" color="secondary" disabled={!this.canChange()} onClick={() => this.setState({ deleteIsOpen: true })}><Trans>Delete Account</Trans></Button>
            &nbsp;
            <Button id="EditAccount" variant="outlined" color="secondary" onClick={() => this.onClickEdit()}><Trans>Edit Account</Trans></Button>
            {this.renderDeleteDialog()}
          </SubPanel>
        }
        {this.renderEditDialog()}
        {
          account && account.periods && account.periods.length > 0 &&
              <SubPanel>
                <SubTitle><Trans>Periods</Trans></SubTitle>
                {
                  account.periods.map((period) => <div key={period.id}>
                    <Labeled title={<>
                      <Localize date={period.start_date}/> - <Localize date={period.end_date}/>
                    &nbsp;
                      {period.locked ? <Lock/> : <LockOpen/>}
                    </>}>
                      <Link color="inherit" onClick={() => this.props.navigate(`/${db}/txs/${period.id}/${account.id}`)}>
                        {
                          period.entries === 0
                            ? this.props.t('no transactions', { num: period.entries })
                            : period.entries === 1
                              ? this.props.t('1 transaction', { num: period.entries })
                              : this.props.t('{{count}} transactions', { count: period.entries })
                        }
                      </Link>
                    </Labeled>
                  </div>)
                }
              </SubPanel>
        }
      </div>
    )
  }
}

Account.propTypes = {
  t: PropTypes.func,
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store)
}

export default Account
