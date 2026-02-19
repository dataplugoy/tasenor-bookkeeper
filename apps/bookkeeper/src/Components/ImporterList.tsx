import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { useTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import { ImporterModelData } from '@tasenor/common'
import { AlertIcon } from '@tasenor/common-ui'
import withStore from '../Hooks/withStore'
import { useParams } from 'react-router-dom'
import { ListMenu } from './ListMenu'
import Catalog from '../Stores/Catalog'
import withCatalog from '../Hooks/withCatalog'

export type ImporterListProps = {
  catalog: Catalog
  store: Store
}

const ImporterList = withCatalog(withStore(observer((props: ImporterListProps): JSX.Element => {
  const { store, catalog } = props
  const params = useParams()
  const [importers, setImporters] = useState<ImporterModelData[]>([])
  const { t } = useTranslation()

  useEffect(() => {
    const versions = catalog.getPluginVersions()
    store.fetchImporters(params.db).then((importers) => {
      importers.forEach(importer => {
        const oldVersion = importer.config.version || '0.0.0'
        const newVersion = versions[importer.config.handler]
        if (oldVersion !== newVersion) {
          importer.config.needUpdate = true
        }
      })
      setImporters(importers)
    })
  }, [params])

  const menu = (importers || []).map(importer => ({
    page: 'data',
    id: importer.id,
    title: <>{importer.name}{importer.config.needUpdate ? <AlertIcon/> : ''}</>,
    disabled: () => false,
    default: false
  }))

  return <ListMenu title="Importers" emptyMessage={t('There are no importers configured.')} menu={menu} matchVar="importerId"/>
})))

export default ImporterList
