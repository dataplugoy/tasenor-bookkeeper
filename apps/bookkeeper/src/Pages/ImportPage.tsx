import React, { useEffect, useState } from 'react'
import { Note, Title, useNav } from '@tasenor/common-ui'
import { Trans, useTranslation } from 'react-i18next'
import { haveCatalog } from '@tasenor/common'
import { ImportTabs } from '../Components/ImportTabs'
import withStore from '../Hooks/withStore'
import Store from '../Stores/Store'
import { Box, Button } from '@mui/material'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ImportProps {
  store: Store
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ImportPage = withStore((props: ImportProps): JSX.Element => {
  const { store } = props
  const catalog = haveCatalog()
  const { db, side } = useNav()
  const { t } = useTranslation()
  const [alert, setAlert] = useState('')

  const importerId = side ? parseInt(side) : null
  const canImport = Object.keys(catalog.getImportOptions()).length > 0

  useEffect(() => {
    // TODO: This fails on refresh of the page.
    setAlert('')
    const versions = catalog.getPluginVersions()
    store.fetchImporter(db, side).then((res) => {
      const version = res.config.version || '0.0.0'
      const pluginCode = res.config.handlers[0]
      if (versions[pluginCode] !== version) {
        setAlert(
          t('Import rules have been created with version {old}. The import plugin has version {new}.').replace('{old}', version).replace('{new}', versions[pluginCode]) +
          t('You may keep the old rules (and possible create separate importer for new rules) or update the rules of this importer.')
        )
      }
    })
  }, [db, side])

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
              &nbsp;<Button variant="outlined">Keep</Button>
              &nbsp;<Button variant="outlined">Upgrade</Button>
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
})

export default ImportPage
