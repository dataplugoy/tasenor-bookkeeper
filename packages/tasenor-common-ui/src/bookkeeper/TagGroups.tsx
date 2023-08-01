import React, { useState } from 'react'
import { TagModel, Tag, TagType } from '@tasenor/common'
import { observer } from 'mobx-react'
import { Box, Grid, Typography } from '@mui/material'
import { TagChip } from './TagChip'
import { Trans } from 'react-i18next'

export type TagGroupProps = {
  tags: Record<Tag, TagModel>
  types?: TagType[]
  options?: Tag[]
  selected: Tag[]
  single?: boolean
  onChange: CallableFunction
}

export const TagGroup = observer((props: TagGroupProps) => {
  const { tags, types, selected, options } = props
  const tagGroups: Record<TagType, TagModel[]> = {}
  const [selectedTags, setSelectedTags] = useState<Tag[]>(selected)
  const typeSet = types ? new Set<TagType|null>(types) : new Set<TagType|null>(Object.values(tags).map(tag => tag.type))
  const optionSet = options ? new Set<Tag>(options) : new Set<Tag>()

  let found = false

  Object.values(tags).forEach(tag => {
    if (tag.type && (!types || typeSet.has(tag.type)) && (!options || optionSet.has(tag.tag as Tag))) {
      tagGroups[tag.type] = tagGroups[tag.type] || []
      tagGroups[tag.type].push(tag)
      found = true
    }
  })

  const onClick = (clicked: TagModel): void => {
    let newTags
    const tag = clicked.tag

    if (tag === null) {
      return
    }

    if (props.single) {

      if (selectedTags.includes(tag)) {
        newTags = []
      } else {
        newTags = [tag]
      }

    } else {

      if (selectedTags.includes(tag)) {
        newTags = selectedTags.filter(t => t !== tag)
      } else {
        newTags = selectedTags.concat([tag])
      }
    }
    props.onChange(newTags)
    setSelectedTags(newTags)
  }

  if (!found) {
    return <Box>
      <Trans>No suitable tags available.</Trans>
      {options && options.length > 0 && <div><Trans>Tried to look for the following tags:</Trans> {options.join(', ')}</div>}
      {types && types.length > 0 && <div><Trans>Tried to look for the following tag types:</Trans> {types.join(', ')}</div>}
    </Box>
  }

  return (
    <>
      {[...typeSet].map(type => type && tagGroups[type] &&
        <Box key={type}>
          <Typography variant="caption">{type}</Typography>
          <Grid container spacing={1}>
            {tagGroups[type].map(tag => (
              tag.tag !== null &&
              <Grid item key={tag.tag}>
                <TagChip disabled={!selectedTags.includes(tag.tag)} tag={tag} onClick={() => onClick(tag)}/>
              </Grid>
            ))}
          </Grid>
        </Box>)
      }
    </>
  )
})
