import { Cursor, haveCursor, haveStore, ID, ProcessConfig, Store } from '@dataplug/tasenor-common'
import { JsonEditor } from '@dataplug/tasenor-common-ui'
import React, { useState, useEffect } from 'react'
import Loading from './Loading'
import ImporterModel from '../Models/ImporterModel'
import { observer } from 'mobx-react'
import { runInAction } from 'mobx'

/**
 * Edit raw JSON of settings.
 */
export type ImporterEditorProps = {
  visible: boolean
  importerId: ID
  onClose: () => void
}

export const ImporterEditor = observer((props: ImporterEditorProps): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(true)
  const [importer, setImporter] = useState<ImporterModel | null>(null)
  const [config, setConfig] = useState<ProcessConfig>()

  const { visible, importerId, onClose } = props
  const store: Store = haveStore()
  const cursor: Cursor = haveCursor()

  useEffect(() => {
    async function load() {
      setLoading(true)
      const importer = await store.fetchImporter(store.db, importerId)
      setImporter(importer)
      setConfig(importer.config)
      setLoading(false)
    }
    importerId && store.db && load()
  }, [importerId, store, store.db])

  if (!visible || !importerId || !config) {
    return <></>
  }

  cursor.disableHandler()

  const onSave = async (json) => {
    if (importer) {
      runInAction(async () => {
        importer.config = json
        setConfig(json)
        setLoading(true)
        await importer.save()
        setLoading(false)
      })
    }
    cursor.enableHandler()
    onClose()
  }

  const onCancel = () => {
    cursor.enableHandler()
    onClose()
  }

  return (
    <div className="ImporterEditor">
      <Loading visible={loading}/>
      <JsonEditor json={config} visible={visible && !loading} title="Edit Configuration" onCancel={onCancel} onSave={onSave}/>
    </div>
  )
})

export default ImporterEditor
