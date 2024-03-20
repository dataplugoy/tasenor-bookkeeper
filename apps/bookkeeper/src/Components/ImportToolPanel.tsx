import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { Trans, useTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import { Dialog, IconSpacer, IconButton, Title, FileUploader, useNav, Confirm } from '@tasenor/common-ui'
import ImporterConfigEditor from './ImporterConfigEditor'
import { TextField, MenuItem, FormControl, Box } from '@mui/material'
import ImporterModel from '../Models/ImporterModel'
import Catalog from '../Stores/Catalog'
import { ID, haveCursor, haveSettings } from '@tasenor/common'
import i18n from '../i18n'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'
import { useParams } from 'react-router-dom'

interface ImportToolPanelProps {
  catalog: Catalog
  store: Store
}

const ImportToolPanel = observer(withStore(withCatalog((props: ImportToolPanelProps): JSX.Element => {

  const { store, catalog } = props
  const params = useParams()
  const { importerId } = useParams()
  const { t } = useTranslation()
  const canImport = Object.keys(catalog.getImportOptions()).length > 0
  const nav = useNav()
console.log(useParams());
  const [showCreateImportDialog, setShowCreateImportDialog] = useState(false)
  const [showEdiSettingstDialog, setShowEdiSettingstDialog] = useState(false)
  const [showCannotDelete, setShowCannotDelete] = useState(false)
  const [changed, setChanged] = useState(false)
  const [handler, setHandler] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    const cursor = haveCursor()

    cursor.registerTools({
      keyIconA: () => {
        const options = catalog.getImportOptions()
        if (Object.keys(options).length === 0) {
          return
        }
        setShowCreateImportDialog(true)
        return { preventDefault: true, changed: false }
      },

      keyIconS: () => {
        if (importerId) {
          setShowEdiSettingstDialog(!showEdiSettingstDialog)
        }
        return { preventDefault: true }
      },

      keyIconX: () => {
        const processId = nav.get('processId')
        store.fetchImport(store.db, importerId, processId).then(res => {
          if (res.status === 'SUCCEEDED') {
            setShowCannotDelete(true)
          } else {
            store.request(`/db/${store.db}/import/${importerId}/process/${processId}`, 'DELETE').then(res => {
              if (res) {
                store.addMessage(t('Imported data deleted.'))
              }
              nav.go({ processId: null })
            })
          }
        })
        return { preventDefault: true }
      }
    })

    return () => {
      cursor.registerTools(null)
    }
  }, [params])

  if (!store.isLoggedIn()) {
    return <></>
  }

  const options = catalog.getImportOptions()

  const onUpload = async function(files) {
    if (!importerId) {
      store.addError('Arbitrary file upload not yet implemented. Please create and select an importer.')
      return
    }

    const firstDate = store.period ? store.period.start_date : null
    const lastDate = store.period ? store.period.end_date : null
    const data = await store.uploadImportFiles(importerId, { files, firstDate, lastDate })

    if (data) {
      await store.fetchBalances()
      nav.go({ processId: data.processId, step: data.step })
    } else {
      store.addError(t('Importing a file failed.'))
    }
  }

  const onCreateImport = async function() {
    const settings = haveSettings()
    const importer = new ImporterModel(store, {
      name,
      config: {
        currency: settings.get('currency'),
        handler,
        language: i18n.language
      }
    })
    await importer.save()
    setShowCreateImportDialog(false)
    setChanged(false)
    setName('')

    store.addMessage(t('New importer created.'))

    nav.go({ side: `${importer.id}` })
  }

  const onFinishEdit = async function() {
    setShowEdiSettingstDialog(false)
    store.fetchImporters(store.db)
  }

  return <Box className="ToolPanel ImportToolPanel">
    <Title><Trans>Data Transfer Center</Trans></Title>
    <IconButton id="CreateImport" disabled={!canImport} shortcut="A" pressKey="IconA" title="new-import" icon="new"/>
    <IconButton id="ConfigureImport" disabled={!importerId} shortcut="S" pressKey="IconS" title="import-settings" icon="settings"/>
    <IconSpacer />
    <FileUploader color="primary" disabled={!canImport} variant="contained" onUpload={files => onUpload(files)}/>
    <IconSpacer />
    <IconButton id="DeleteImport" disabled={!nav.get('processId')} shortcut="X" pressKey="IconX" title="delete-import" icon="trash"/>

    <Dialog
      className="CreateImport"
      wider
      title={<Trans>Create New Import</Trans>}
      isVisible={showCreateImportDialog}
      onClose={() => setShowCreateImportDialog(false)}
      onConfirm={() => onCreateImport()}
      isValid={() => !!handler && !!name}
    >
      <FormControl fullWidth>
        <TextField
          select
          name="handler"
          value={handler}
          label={<Trans>Select plugin for handling the import</Trans>}
          error={changed && !handler}
          helperText={changed && !handler ? t('Plugin is required.') : ''}
          onChange={(event) => {
            setChanged(true)
            setHandler(event.target.value)
          }}
        >
          <MenuItem value=""></MenuItem>
          {Object.entries(options).map(([code, title]) => <MenuItem key={code} value={code}><Trans>{title}</Trans></MenuItem>)}
        </TextField>
      </FormControl>
      <FormControl fullWidth>
        <TextField
          name="name"
          fullWidth
          error={changed && !name}
          helperText={changed && !name ? t('Name is required.') : ''}
          label={<Trans>Give name for the import process</Trans>}
          value={name}
          onChange={(event) => {
            setChanged(true)
            setName(event.target.value)
          }}
        />
      </FormControl>
    </Dialog>

    <ImporterConfigEditor visible={showEdiSettingstDialog} importerId={parseInt(importerId || '') as ID} onClose={() => onFinishEdit()} />

    <Confirm isVisible={showCannotDelete} title={t('Alert')} onClose={() => setShowCannotDelete(false)}>
      <Trans>You cannot delete an import that has been successfully executed.</Trans>
      <> </>
      <Trans>You need to revert changes first.</Trans>
    </Confirm>
  </Box>
})))

export default ImportToolPanel
