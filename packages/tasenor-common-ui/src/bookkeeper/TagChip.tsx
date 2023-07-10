import React from 'react'
import { TagModel } from '@dataplug/tasenor-common'
import { RadioButtonChecked, RadioButtonUnchecked } from '@mui/icons-material'
import { Avatar, Chip } from '@mui/material'

export type TagChipProps = {
  disabled?: boolean
  onClick?: CallableFunction
  tag: TagModel
}

export const TagChip = (props: TagChipProps) => {
  const { disabled, onClick, tag: { name, url } } = props

  return (
    <Chip
      avatar={<Avatar src={url as string}></Avatar>}
      label={name}
      deleteIcon={disabled ? <RadioButtonUnchecked/> : <RadioButtonChecked/>}
      variant="outlined"
      color="primary"
      clickable
      onDelete={() => 1}
      onClick={() => onClick && onClick() }
    />
  )
}
