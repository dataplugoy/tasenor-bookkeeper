import React, { useState } from 'react'
import { Title, ToolPlugin, QuestionMarkInline, FileUploadData, FileUploader } from '@tasenor/common-ui'
import { DatabaseModel, haveCursor, isTag, Tag, TagModel, TagType, Url } from '@tasenor/common'
import { Trans, useTranslation } from 'react-i18next'
import { Box, Button, Card, CardContent, CardMedia, Grid, IconButton, Tab, Tabs, TextField, Typography } from '@mui/material'
import { Add, Cancel, CheckCircle } from '@mui/icons-material'
import { runInAction } from 'mobx'
import clone from 'clone'
import { green, red } from '@mui/material/colors'
import { observer } from 'mobx-react'

/**
 * A single tag display and editor.
 * @param props
 * @returns
 */
type TagCardProps = {
  tag?: TagModel
  existingTags: Set<Tag>
  onSave?: (tag: Partial<TagModel>) => Promise<void>
  onCreate?: (tag: Partial<TagModel>) => Promise<void>
  onDelete?: (tag: Tag) => Promise<void>
}

const TagCard = observer((props: TagCardProps): JSX.Element => {

  const { t } = useTranslation()
  const cursor = haveCursor()

  const [edit, setEdit] = useState(false)
  const [changed, setChanged] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { name, tag, order, picture, mime } = props.tag ? props.tag : { name: '', tag: '', order: 0, picture: '', mime: '' }

  const [tagName, setTagName] = useState<string>(name)
  const [tagTag, setTagTag] = useState<Tag>(tag as Tag)
  const [tagPicture, setTagPicture] = useState<string>('')
  const [tagMime, setTagMime] = useState(mime)

  let url = props.tag && props.tag.url
  if (tagPicture) {
    url = `data:${tagMime};base64,${tagPicture}` as Url
  } else if (props.tag && props.tag.picture) {
    url = `data:image/png;base64,${props.tag.picture}` as Url
  }
  if (!url) {
    url = QuestionMarkInline as Url
  }

  // Handle saving the tag.
  const onSave = async (): Promise<void> => {
    if (isNew) {
      props.onCreate && await props.onCreate({ name: tagName, tag: tagTag, picture: tagPicture, mime: tagMime })
    } else {
      props.onSave && await props.onSave({ name: tagName, tag: tagTag, picture: tagPicture, mime: tagMime })
    }
    setEdit(false)
    setTagName('')
    setTagTag('' as Tag)
    setTagPicture('')
    setTagMime('')
  }

  // Handle deleting the tag.
  const onDelete = async (): Promise<void> => {
    props.onDelete && await props.onDelete(tag as Tag)
  }

  // Handle file upload.
  const onUpload = (file: FileUploadData): void => {
    setTagPicture(file.data)
    setTagMime(file.type as TagType)
    setChanged(true)
  }

  // Cancel editing.
  const onCancel = (): void => {
    setEdit(false)
    setTagName('')
    setTagTag('' as Tag)
    setTagPicture('')
    setTagMime('')
  }

  // Key shortcuts.
  const onKeyUp = (key: string): void => {
    if (key === 'Enter') {
      if (validateName() === null && validateTag() === null) {
        onSave()
      }
    }
    if (key === 'Escape') {
      onCancel()
    }
  }

  // Validator for name.
  const validateName = (): string | null => {
    if (!changed) {
      return null
    }
    return tagName ? null : t('Tag name is required')
  }

  // Validator for tag.
  const validateTag = (): string | null => {
    if (!changed) {
      return null
    }
    if (!tagTag) {
      return t('Tag code is required')
    }
    if ((!props.tag || tagTag !== props.tag.tag) && props.existingTags.has(tagTag as Tag)) {
      return 'Tag already exists'
    }
    return isTag(tagTag as Tag) ? null : 'Invalid tag'
  }

  return (
    <Card raised sx={{ display: 'flex', width: 450 }}>
      <CardContent sx={{ flex: '1 0 auto' }}>
        {
          !edit && <>
            <Typography component="div" variant="h5">
              {name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" component="div">
              {tag} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <Typography variant="subtitle2" component="span">
                {order ? `#${order}` : ''}
              </Typography>
            </Typography>
            {props.tag && !isDeleting &&
              <>
                <Button size="small" onClick={() => {
                  setIsNew(false)
                  setEdit(true)
                  setTagName(name)
                  setTagTag(tag as Tag)
                  setTagPicture(picture || '')
                  setTagMime(mime)
                }}><Trans>Edit</Trans></Button>
                <Button size="small" onClick={() => { setIsDeleting(true) }}><Trans>Delete</Trans></Button>
              </>
            }
            {isDeleting &&
              <>
                <Trans>Are you sure?</Trans>
                <Button size="small" onClick={() => { setIsDeleting(false) }}><Trans>No</Trans></Button>
                <Button size="small" onClick={() => { setIsDeleting(false); onDelete() }}><Trans>Yes</Trans></Button>
              </>
            }
            {!props.tag &&
              <Button size="small" onClick={() => { setIsNew(true); setEdit(!edit) }}><Trans>Add New</Trans></Button>}
          </>
        }
        {
          edit && <>
            <TextField
              autoFocus
              onFocus={() => cursor.disableHandler()}
              onBlur={() => cursor.enableHandler()}
              error={!!validateName()}
              label={validateName()}
              value={tagName}
              onChange={(ev) => { setTagName(ev.target.value); setChanged(true) }}
              onKeyUp={(ev) => onKeyUp(ev.key)}
            />
            <IconButton title={t('Cancel')} onClick={onCancel} sx={{ color: red[800] }}><Cancel/></IconButton>
            <br />
            <TextField
              onFocus={() => cursor.disableHandler()}
              onBlur={() => cursor.enableHandler()}
              value={tagTag}
              error={!!validateTag()}
              label={validateTag()}
              onChange={(ev) => { setTagTag(ev.target.value as Tag); setChanged(true) }}
              onKeyUp={(ev) => onKeyUp(ev.key)}
            />
            <IconButton title={t('Save')} onClick={onSave} sx={{ color: green[800] }}><CheckCircle/></IconButton>
          </>
        }
      </CardContent>
      {
        edit &&
        <Box
          sx={{
            width: 150,
            height: 150,
            borderLeft: 1,
            opacity: 0.5,
            borderColor: 'divider',
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <FileUploader text="" color="info" iconSize={130} onUpload={(files) => onUpload(files[0])} />
        </Box>
      }
      {
        !edit &&
        <CardMedia
          component="img"
          sx={{ width: 150, height: 150, borderLeft: 1, borderColor: 'divider' }}
          image={url}
          alt={name}
        />
      }
    </Card>
  )
})

/**
 * A panel providing editors for all tags in the group.
 */
type GroupPanelProps = {
  group: TagType
  tags: TagModel[]
  onSave: (tag: TagModel) => Promise<void>
  onDelete: (tag: TagModel) => Promise<void>
  onCreate: (tag: Partial<TagModel>) => Promise<void>
  existingTags: Set<Tag>
}

const GroupPanel = observer((props: GroupPanelProps): JSX.Element => {

  // Handler for saving a tag
  const onSave = async (tag: TagModel, changes: Partial<TagModel>): Promise<void> => {
    runInAction(() => {
      tag.name = changes.name || ''
      tag.tag = changes.tag as Tag
      tag.picture = changes.picture || null
      tag.mime = changes.mime || null
      tag.type = props.group
    })
    await props.onSave(tag)
  }

  // Handler for creating a tag
  const onCreate = async (changes: Partial<TagModel>): Promise<void> => {
    await props.onCreate(changes)
  }

  // Handler for deleting a tag
  const onDelete = async (tag: TagModel): Promise<void> => {
    await props.onDelete(tag)
  }

  return (
    <Grid container spacing={2}>
      {props.tags.map((tag, idx) => (
        <Grid item key={idx}>
          <TagCard tag={tag} existingTags={props.existingTags} onSave={(changes) => onSave(tag, changes)} onDelete={() => onDelete(tag)} />
        </Grid>
      ))}
      <Grid item key={-1}><TagCard existingTags={props.existingTags} onCreate={(tag) => onCreate(tag)} /></Grid>
    </Grid>
  )
})

/**
 * An editor for tags collection in a database.
 */
export type TagsEditorProps = {
  database: DatabaseModel
  onSave: (tag: TagModel) => Promise<void>
  onDelete: (tag: TagModel) => Promise<void>
  onCreate: (tag: Partial<TagModel>) => Promise<TagModel>
}

const TagsEditor = observer((props: TagsEditorProps): JSX.Element => {

  const cursor = haveCursor()
  const { t } = useTranslation()
  const tags = props.database.tagsByTag
  const [tab, setTab] = useState(0)
  const [addingTab, setAddingTab] = useState<TagType>('' as TagType)

  // Sort types and tags by their order number found.
  const typeRange: Record<TagType, { min: number, max: number }> = {}
  const byGroups: Record<TagType, TagModel[]> = {}
  const orderNumbers: Set<number> = new Set()
  const existingTags: Set<Tag> = new Set()

  Object.values(tags).forEach(tag => {
    if (!tag.tag || !tag.type) {
      return
    }
    if (typeRange[tag.type] === undefined) {
      typeRange[tag.type] = { min: tag.order, max: tag.order }
    } else {
      if (tag.order < typeRange[tag.type].min) {
        typeRange[tag.type].min = tag.order
      } else if (tag.order > typeRange[tag.type].max) {
        typeRange[tag.type].max = tag.order
      }
    }
    orderNumbers.add(tag.order)
    existingTags.add(tag.tag)
    byGroups[tag.type] = byGroups[tag.type] || []
    byGroups[tag.type].push(tag)
  })

  // Sort each group and types and make types as a state.
  const sortedTypes: TagType[] = Object.keys(typeRange).sort((a: TagType, b: TagType) => typeRange[a].min - typeRange[b].min) as TagType[]
  Object.keys(byGroups).forEach(name => {
    byGroups[name] = byGroups[name].sort((a, b) => a.order - b.order)
  })
  const [types, setTypes] = useState<TagType[]>(sortedTypes)
  const [groups, setGroups] = useState<Record<string, TagModel[]>>(byGroups)

  // Handler for new type creation.
  const onCreateTab = (): void => {
    if (!addingTab) {
      setTab(types.length - 1)
      return
    }
    setTypes(types.concat(addingTab))
    setGroups({ ...groups, [addingTab]: [] })
    setAddingTab('' as TagType)
  }

  // Handler for saving a tag
  const onSave = async (tag: TagModel): Promise<void> => {
    await props.onSave(tag)
  }

  // Handler for deleting a tag
  const onDelete = async (tag: TagModel): Promise<void> => {
    await props.onDelete(tag)
    const newGroups = clone(groups)
    newGroups[tag.type] = newGroups[tag.type].filter(t => t.tag !== tag.tag)
    setGroups(newGroups)
  }

  // Handler for creating a tag
  const onCreate = async (tag: Partial<TagModel>): Promise<void> => {
    const type = types[tab]
    let order = Math.max(...groups[type].map(t => t.order)) + 1
    // Set number to new group.
    if (groups[type].length === 0) {
      const idx = types.indexOf(type)
      order = (idx + 1) * 1000 + 1
    }
    // Ensure non-overlapping.
    while (orderNumbers.has(order)) {
      order++
    }
    if (tag.tag) {
      const model = await props.onCreate({
        tag: tag.tag as Tag,
        name: tag.name,
        picture: tag.picture,
        mime: tag.mime,
        type,
        order
      })
      setGroups({ ...groups, [type]: groups[type].concat([model]) })
    }
  }

  // Handler for tab editor key presses.
  const onKeyUp = (key: string): void => {
    if (key === 'Enter') {
      onCreateTab()
    }
    if (key === 'Escape') {
      setAddingTab('' as TagType)
      if (tab) setTab(tab - 1)
    }
  }

  // TODO: Editing type name by clicking already selected tab.

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs value={tab} onChange={(event, newValue) => setTab(newValue)}>
        {
          types.map((type, idx) => (
            <Tab key={idx} label={type} />
          ))
        }
        <Tab
          key={-1}
          disableRipple
          icon={types[tab] && <Add />}
          iconPosition="start"
          label={types[tab]
            ? t('Add Tag Type')
            : <TextField
              autoFocus
              onFocus={() => cursor.disableHandler()}
              onBlur={() => cursor.enableHandler()}
              value={addingTab}
              onChange={ev => setAddingTab(ev.target.value as TagType)}
              onKeyUp={(ev) => onKeyUp(ev.key)}
            />
          }
        />
      </Tabs>
      {types[tab] && (
        <>
          <GroupPanel
            group={types[tab] as TagType}
            tags={groups[types[tab]]}
            existingTags={existingTags}
            onSave={tag => onSave(tag)}
            onCreate={tag => onCreate(tag)}
            onDelete={tag => onDelete(tag)}
          />
        </>
      )}
      {types.length === 0 && (
        <Typography variant="h6" sx={{ padding: 1 }}>
          <Trans>You don&apos;t have any tag groups yet. Please create the firt one by naming it above.</Trans>
        </Typography>
      )}
    </Box>
  )
})

class TagEditor extends ToolPlugin {

  static code = 'TagEditor'
  static title = 'Tag Editor'
  static version = '1.0.33'
  static icon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 7H5v10h11l3.55-5z" opacity=".3"/><path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z"/></svg>'
  static releaseDate = '2022-03-11'
  static use = 'ui'
  static type = 'tool'
  static description = 'Allows creating, deleting and editing tags and tag groups. Tags are useful for example for filtering transaction lists and combining reports by customizable groups.'

  constructor() {
    super()
    this.languages = {
      fi: {
        'Add Tag Type': 'Lisää uusi ryhmä',
        'Tag Editor': 'Tägieditori',
        'Tag name is required': 'Tägillä pitää olla nimi',
        'Tag code is required': 'Tägillä pitää olla koodi',
        'Tag already exists': 'Tägi on jo olemassa',
        'Invalid tag': 'Virheellinen tägi',
        'Edit Tags in the Database': 'Muokkaa tietokannan tägejä',
        'A tag is a special notation that can be added to the beginning of the transaction description.': 'Tägi on erityisnotaatio, jota voidaan käyttää tapahtuman kuvauksen alussa.',
        'A short code, e.g. XYZ an be added in the beginning of the description as [XYZ].': 'Esimerkiksi tägi, jonka koodi on XYZ, voidaan lisätä kuvauksen alkuun kirjoittamalla [XYZ].',
        'Once added, the tag can be used in transaction list as a filter by showing only the transactions with the give tag.': 'Kun tapahtumaan on lisätty tägi, sitä voidaan käyttää tapahtumalistan filtteröintiin näyttämään vain kyseise tägin sisältämät rivit.',
        'Tag grouping is used to keep tags of the specific dimension in the single group.': 'Tägien ryhmittelyä käytetään tietyn dimension tägien yhdistämiseen saman nimen alle.',
        'It is usable in some reports for example.': 'Ryhmittelyä voidaan hyödyntää esimerkiksi joissakin raporteissa.',
        'You don&apos;t have any tag groups yet. Please create the firt one by naming it above.': 'Yhtään tägiryhmää ei ole vielä olemassa. Ole hyvä ja luo ensimmäinen antamalla sille nimi yllä.',
      }
    }
  }

  toolMenu() {
    return [{ title: 'Tag Editor', disabled: !this.store || !this.store.db }]
  }

  toolTitle() {
    return 'Tag Editor'
  }

  toolTopPanel() {
    return <Typography sx={{ padding: 1 }}>
      <Trans>A tag is a special notation that can be added to the beginning of the transaction description.</Trans>
      <Trans>A short code, e.g. XYZ an be added in the beginning of the description as [XYZ].</Trans>
      <Trans>Once added, the tag can be used in transaction list as a filter by showing only the transactions with the give tag.</Trans>
      <Trans>Tag grouping is used to keep tags of the specific dimension in the single group.</Trans>
      <Trans>It is usable in some reports for example.</Trans>
    </Typography>
  }

  toolMainPanel(): JSX.Element {
    const { store } = this

    if (!store || !store.database) {
      return <></>
    }

    const onSave = async (tag: TagModel) => {
      await tag.save()
    }

    const onDelete = async (tag: TagModel) => {
      await tag.delete()
    }

    const onCreate = async (tag: Partial<TagModel>): Promise<TagModel> => {
      const model = await store.database.addTag(tag)
      await model.save()
      return model
    }

    return (
      <Box sx={{ padding: 1 }}>
        <Title><Trans>Edit Tags in the Database</Trans></Title>
        <TagsEditor
          database={store.database}
          onDelete={onDelete}
          onSave={onSave}
          onCreate={onCreate}
        />
      </Box>
    )
  }
}

export default TagEditor
