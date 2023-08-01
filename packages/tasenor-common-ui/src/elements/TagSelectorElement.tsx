import React from 'react'
import { Tag, TagModel, TagsElement, RenderingProps, isNamedElement } from '@tasenor/common'
import { FormGroup, FormLabel } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { TagGroup } from '../bookkeeper/TagGroups'
import { Renderer } from '../risp/RenderingEngine'

export const TagsSelectorRenderer: Renderer = (props: RenderingProps<TagsElement>) => {
  const { t } = useTranslation()
  const { element, setup, values } = props
  const [selected, setSelected] = React.useState<Tag[]>(isNamedElement(element) ? values[element.name] as Tag[] || [] : [])
  const label = ('label' in element) ? element.label : ((isNamedElement(element) && element.name) ? t(`label-${element.name}`) : '')

  let Selector = <></>

  const tags: Record<Tag, TagModel> = setup.store.db ? setup.store.dbsByName[setup.store.db].tagsByTag : {}
  const onChange = (selected) => {
    setSelected(selected)
    const newValue = element.single ? selected[0] : selected
    element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value: newValue }, props)
  }

  if ('types' in element) {
    Selector = (
      <TagGroup
        tags={tags}
        single={!!element.single}
        types={element.types}
        onChange={onChange}
        selected={selected}
      />
    )
  } else if ('options' in element) {
    Selector = (
      <TagGroup
        tags={tags}
        single={!!element.single}
        options={element.options}
        onChange={onChange}
        selected={selected}
      />
    )
  } else if (element.all) {
    Selector = (
      <TagGroup
        tags={tags}
        single={!!element.single}
        options={Object.keys(tags) as Tag[]}
        onChange={onChange}
        selected={selected}
      />
    )
  } else {
    throw new Error(`Unable to figure out how to render selector ${JSON.stringify(element)}.`)
  }
  return <FormGroup>
    <FormLabel>{label}</FormLabel>
    {Selector}
  </FormGroup>
}
