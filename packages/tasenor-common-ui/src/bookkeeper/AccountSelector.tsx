import React from 'react'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import { Autocomplete, Box, TextField } from '@mui/material'
import { AccountNumber, FilterRule, AccountModel, filter2function } from '@tasenor/common'
import { observer } from 'mobx-react'

export type AccountSelectorProps = {
  label: string
  value: AccountModel | null
  onChange: (acc: AccountModel | null) => void
  preferred?: AccountNumber[]
  autoFocus?: boolean
  accounts: AccountModel[]
  filter?: FilterRule
}

export const AccountSelector = observer((props: AccountSelectorProps) => {

  const { value, onChange, label, autoFocus } = props

  const filter = filter2function<AccountModel>(props.filter)
  const notSelected = { id: 0, name: '', number: '' as AccountNumber }

  let accounts: Partial<AccountModel>[] = [notSelected]
  const preferred: Partial<AccountModel>[] = []

  let preferredSet = new Set()
  if (props.preferred) {
    preferredSet = new Set(props.preferred)
    props.accounts.filter((a) => filter(a)).forEach(a => {
      if (preferredSet.has(a.number)) {
        preferred.push(a)
      } else {
        accounts.push(a)
      }
    })
    accounts = preferred.concat(accounts)
  } else {
    accounts = accounts.concat(props.accounts.filter((a) => filter(a)))
  }

  return <Autocomplete
    id="Select Account"
    autoFocus={!!autoFocus}
    options={accounts}
    getOptionLabel={(option) => `${option.number} ${option.name}`}
    renderOption={(props, option) => (
      <Box component="li" {...props}>
        {option.number} {option.name}
        {preferredSet.has(option.number) && <StarOutlineIcon fontSize="small" sx={{ color: 'rgba(0,0,0,0.2)' }}/>}
      </Box>
    )}
    value={value && value.id ? value : notSelected}
    onChange={(_, value) => onChange(value && value.id ? value as AccountModel : null)}
    renderInput={(params) => (
      <TextField
        {...params}
        label={label}
        inputProps={{
          ...params.inputProps,
          autoComplete: 'off'
        }}
      />
    )}
  />
})
