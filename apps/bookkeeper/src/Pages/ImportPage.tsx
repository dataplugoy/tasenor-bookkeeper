import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { Note, Title, useNav } from '@tasenor/common-ui'
import { Trans, useTranslation } from 'react-i18next'
import { PluginCode, haveCatalog } from '@tasenor/common'
import { ImportTabs } from '../Components/ImportTabs'
import withStore from '../Hooks/withStore'
import Store from '../Stores/Store'
import { Box, Button } from '@mui/material'
import ImporterModel from '../Models/ImporterModel'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ImportProps {
  store: Store
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ImportPage = withStore(observer((props: ImportProps): JSX.Element => {
  const { store } = props
  const catalog = haveCatalog()
  const { db, side } = useNav()
  const { t } = useTranslation()
  const [alert, setAlert] = useState('')
  const [importer, setImporter] = useState<ImporterModel|null>(null)

  const importerId = side ? parseInt(side) : null
  const canImport = Object.keys(catalog.getImportOptions()).length > 0
  const versions = catalog.getPluginVersions()

  useEffect(() => {
    setAlert('')

    if (!side) return

    store.fetchImporter(db, side).then((res) => {
      setImporter(res)
      const version = res.config.version || '0.0.0'
      const pluginCode = res.config.handler
      if (versions[pluginCode] !== version) {
        setAlert(
          t('Import rules have been created with version {old}. The import plugin has now version {new}.').replace('{old}', version).replace('{new}', versions[pluginCode]) +
          t('You may keep the old rules (and possible create separate importer for new rules) or update the rules of this importer.')
        )
      }
    })
  }, [db, side, importer && importer.id])

  const onKeep = async () => {
    if (!importer) return
    const pluginCode = importer.config.handler as PluginCode
    await store.request(`/db/${db}/importer/${importerId}`, 'PATCH', { version: versions[pluginCode] })
    // Unfortunately only way to refresh side bar for now. Need to put them under observable in store.
    document.location.reload()
  }

  const onUpgrade = async () => {
    if (!importer) return
    const pluginCode = importer.config.handler as PluginCode
    await store.request(`/db/${db}/importer/${importerId}/upgrade`, 'PUT', { version: versions[pluginCode] })
    // Unfortunately only way to refresh side bar for now. Need to put them under observable in store.
    document.location.reload()
  }

  return (
    <div>
      <Title className="ImportsPage"><Trans>Imports</Trans></Title>
      {
        !canImport && (
          <Note><Trans>There are no import plugins available.</Trans></Note>
        )
      }
      {
        alert !== '' && (
          <Box>
            <Note>
              {alert}
              &nbsp;<Button variant="outlined" onClick={onKeep}>Keep</Button>
              &nbsp;<Button variant="outlined" onClick={onUpgrade}>Upgrade</Button>
            </Note>
          </Box>
        )
      }
      {
        canImport && !importerId && (
          <Box>TODO: Implement arbitrary file uploader that looks for correct importer automatically</Box>
        )
      }
      {
        importerId && <ImportTabs importerId={importerId}/>
      }
    </div>
  )
}))

export default ImportPage
