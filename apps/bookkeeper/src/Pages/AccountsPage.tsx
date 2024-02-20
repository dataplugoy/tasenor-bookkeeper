import React from 'react'
import { observer } from 'mobx-react'
import { Trans } from 'react-i18next'
import AccountTable from '../Components/AccountTable'
import Store from '../Stores/Store'
import { Title } from '@tasenor/common-ui'
import { haveCursor } from '@tasenor/common'
import withStore from '../Hooks/withStore'
import { Box } from '@mui/material'

interface AccountsPageProps {
  store: Store
}

const AccountsPage = withStore(observer((props: AccountsPageProps): JSX.Element => {
  const cursor = haveCursor()
  cursor.selectPage('Accounts', {})

  const { store } = props
  if (!store.isLoggedIn()) {
    return <></>
  }

  const { favorite, asset, liability, equity, revenue, expense, profit, search } = store.tools.accounts

  const types: string[] = []
  if (!asset) types.push('ASSET')
  if (!liability) types.push('LIABILITY')
  if (!equity) types.push('EQUITY')
  if (!revenue) types.push('REVENUE')
  if (!expense) types.push('EXPENSE')
  if (!profit) types.push('PROFIT_PREV')
  if (!profit) types.push('PROFIT')
  const s = search && search.toUpperCase()

  const accounts = store.accounts.filter(acc => (
    (!favorite || acc.FAVOURITE) &&
    (types.includes(acc.type)) &&
    (!s || acc.name.toUpperCase().indexOf(s) >= 0 || acc.number === s)
  ))

  return <Box className="AccountsPage">
    <Title><Trans>Account scheme</Trans></Title>
    <AccountTable accounts={accounts} headings={store.headings} />
  </Box>
}))

export default AccountsPage
