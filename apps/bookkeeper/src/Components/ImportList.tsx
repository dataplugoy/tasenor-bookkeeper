import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { useTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import { ImporterModelData } from '@tasenor/common'
import withStore from '../Hooks/withStore'
import { useParams } from 'react-router-dom'
import { ListMenu } from './ListMenu'

export type ImportListProps = {
  store: Store
}

const ImportList = observer(withStore((props: ImportListProps): JSX.Element => {
  const { store } = props
  const params = useParams()
  const [importers, setImporters] = useState<ImporterModelData[]>([])
  const { t } = useTranslation()

  useEffect(() => store.fetchImporters(params.db).then(importers => setImporters(importers)), [])

  const menu = importers.map(importer => ({
    page: 'data',
    id: importer.id,
    title: importer.name,
    disabled: () => false,
    default: false
  }))

  return <ListMenu title="Importers" emptyMessage={t('There are no importers configured.')} menu={menu} matchVar="importerId"/>
}))

export default ImportList
