import React, { useEffect } from 'react'
import { Note, Title, useNav } from '@tasenor/common-ui'
import { Trans } from 'react-i18next'
import { haveCatalog } from '@tasenor/common'
import { ImportTabs } from '../Components/ImportTabs'
import withStore from '../Hooks/withStore'
import Store from '../Stores/Store'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ImportProps {
  store: Store
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ImportPage = withStore((props: ImportProps): JSX.Element => {
  const { store } = props
  const catalog = haveCatalog()
  const { db, side } = useNav()

  const importerId = side ? parseInt(side) : null
  const canImport = Object.keys(catalog.getImportOptions()).length > 0

  return (
    <div>
      <Title className="ImportsPage"><Trans>Imports</Trans></Title>
      {
        !canImport && (
          <Note><Trans>There are no import plugins available.</Trans></Note>
        )
      }
      {
        canImport && !importerId && (
          <div>TODO: Implement arbitrary file uploader that looks for correct importer automatically</div>
        )
      }
      {
        importerId && <ImportTabs importerId={importerId}/>
      }
    </div>
  )
})

export default ImportPage
