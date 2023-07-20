import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { inject, observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import Store from '../Stores/Store'
import { Dialog, IconSpacer, IconButton, Title, FileUploader } from '@dataplug/tasenor-common-ui'
import ImporterConfigEditor from './ImporterConfigEditor'
import { TextField, MenuItem, FormControl } from '@mui/material'
import ImporterModel from '../Models/ImporterModel'
import { withRouter } from 'react-router'
import ReactRouterPropTypes from 'react-router-prop-types'
import Catalog from '../Stores/Catalog'
import { haveCursor, haveSettings } from '@dataplug/tasenor-common'
import i18n from '../i18n'

@withRouter
@withTranslation('translations')
@inject('store')
@inject('catalog')
@observer
class ImportToolPanel extends Component {

  state = {
    showCreateImportDialog: false,
    showEdiSettingstDialog: false,
    changed: false,
    handler: '',
    name: ''
  }

  componentDidMount() {
    const cursor = haveCursor()
    cursor.registerTools(this)
  }

  componentWillUnmount() {
    const cursor = haveCursor()
    cursor.registerTools(null)
  }

  keyIconA() {
    const options = this.props.catalog.getImportOptions()
    if (Object.keys(options).length === 0) {
      return
    }
    this.setState({ showCreateImportDialog: true })
    return { preventDefault: true, changed: false }
  }

  keyIconS() {
    const { importerId } = this.props.match.params
    if (importerId) {
      this.setState({ showEdiSettingstDialog: !this.state.showEdiSettingstDialog })
    }
    return { preventDefault: true }
  }

  async onUpload(files) {
    const { store, t } = this.props
    const { importerId } = this.props.match.params
    if (!importerId) {
      store.addError('Arbitrary file upload not yet implemented. Please create and select an importer.')
      return
    }
    const firstDate = store.period ? store.period.start_date : null
    const lastDate = store.period ? store.period.end_date : null
    const data = await store.uploadImportFiles(importerId, { files, firstDate, lastDate })
    if (data) {
      await store.fetchBalances()
      let url = `/${store.db}/data/${store.periodId || ''}/${store.accountId || ''}/${importerId}?processId=${data.processId}`
      if (data.step) {
        url += `&step=${data.step}`
      }
      this.props.history.push(url)
    } else {
      store.addError(t('Importing a file failed.'))
    }
  }

  async onCreateImport() {
    const settings = haveSettings()
    const { store, t } = this.props
    const importer = new ImporterModel(this.props.store, {
      name: this.state.name,
      config: {
        currency: settings.get('currency'),
        handlers: [this.state.handler],
        language: i18n.language
      }
    })
    await importer.save()
    this.setState({ showCreateImportDialog: false, changed: false, name: '' })

    store.addMessage(t('New importer created.'))

    const { db, periodId, accountId } = this.props.match.params
    const url = '/' + (db || '_') + '/data/' + (periodId || '') + '/' + ((accountId) || '') + '/' + importer.id
    this.props.history.push(url)
  }

  async onFinishEdit() {
    this.setState({ showEdiSettingstDialog: false })
    this.props.store.fetchImporters(this.props.store.db)
  }

  render() {
    const { store, t, catalog } = this.props
    const { importerId } = this.props.match.params
    const canImport = Object.keys(catalog.getImportOptions()).length > 0

    if (!store.isLoggedIn()) {
      return ''
    }

    const options = catalog.getImportOptions()

    return (
      <div className="ToolPanel ImportToolPanel">
        <Title><Trans>Data Transfer Center</Trans></Title>
        <IconButton id="CreateImport" disabled={!canImport} shortcut="A" pressKey="IconA" title="new-import" icon="new"/>
        <IconButton id="ConfigureImport" disabled={!importerId} shortcut="S" pressKey="IconS" title="import-settings" icon="settings"/>
        <IconSpacer />
        <FileUploader color="primary" disabled={!canImport} variant="contained" onUpload={files => this.onUpload(files)}/>

        <Dialog
            className="CreateImport"
            wider
            title={<Trans>Create New Import</Trans>}
            isVisible={this.state.showCreateImportDialog}
            onClose={() => this.setState({ showCreateImportDialog: false })}
            onConfirm={() => this.onCreateImport()}
            isValid={() => this.state.handler && this.state.name}
          >
          <FormControl fullWidth>
            <TextField
              select
              name="handler"
              value={this.state.handler}
              label={<Trans>Select plugin for handling the import</Trans>}
              error={this.state.changed && !this.state.handler}
              helperText={this.state.changed && !this.state.handler ? t('Plugin is required.') : ''}
              onChange={(event) => (this.setState({ changed: true, handler: event.target.value }))}
            >
              <MenuItem value=""></MenuItem>
              {Object.entries(options).map(([code, title]) => <MenuItem key={code} value={code}><Trans>{title}</Trans></MenuItem>)}
            </TextField>
          </FormControl>
          <FormControl fullWidth>
            <TextField
              name="name"
              fullWidth
              error={this.state.changed && !this.state.name}
              helperText={this.state.changed && !this.state.name ? t('Name is required.') : ''}
              label={<Trans>Give name for the import process</Trans>}
              value={this.state.name}
              onChange={(event) => (this.setState({ changed: true, name: event.target.value }))}
            />
          </FormControl>
        </Dialog>

        <ImporterConfigEditor visible={this.state.showEdiSettingstDialog} importerId={importerId} onClose={ () => this.onFinishEdit()} />

      </div>
    )
  }
}

ImportToolPanel.propTypes = {
  t: PropTypes.func,
  match: PropTypes.object,
  history: ReactRouterPropTypes.history,
  store: PropTypes.instanceOf(Store),
  catalog: PropTypes.instanceOf(Catalog)
}

export default ImportToolPanel
