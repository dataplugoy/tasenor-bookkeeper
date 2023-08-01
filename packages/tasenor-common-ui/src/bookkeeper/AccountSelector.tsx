import React from 'react'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import { MenuItem, TextField } from '@mui/material'
import { AccountNumber, FilterRule, AccountModel, filter2function } from '@tasenor/common'
import { observer } from 'mobx-react'

export type AccountSelectorProps = {
  label: string
  value: AccountNumber
  onChange: (num: AccountNumber) => void
  preferred?: AccountNumber[]
  accounts: AccountModel[]
  filter?: FilterRule
}

export const AccountSelector = observer((props: AccountSelectorProps) => {

  const { value, onChange, label } = props

  const filter = filter2function<AccountModel>(props.filter)

  let accounts: AccountModel[] = []
  const preferred: AccountModel[] = []

  if (props.preferred) {
    const preferredSet = new Set(props.preferred)
    props.accounts.filter((a) => filter(a)).forEach(a => {
      if (preferredSet.has(a.number)) {
        preferred.push(a)
      } else {
        accounts.push(a)
      }
    })
  } else {
    accounts = props.accounts.filter((a) => filter(a))
  }

  return (
  <TextField
    select
    fullWidth
    label={label}
    value={value}
    onChange={(e) => onChange(e.target.value as AccountNumber)}
  >
  <MenuItem value="">&nbsp;</MenuItem>
    {preferred.map((account, idx) => <MenuItem value={account.number} key={account.id} divider={idx === preferred.length - 1}>{account.number} {account.name} <StarOutlineIcon fontSize="small" sx={{ color: 'rgba(0,0,0,0.2)' }}/> </MenuItem>)}
    {accounts.map(account => <MenuItem value={account.number} key={account.id}>{account.number} {account.name}</MenuItem>)}
  </TextField>
  )
})
