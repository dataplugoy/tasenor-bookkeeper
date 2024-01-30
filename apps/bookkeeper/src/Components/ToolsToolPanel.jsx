import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import { Trans, withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import { Dialog, IconButton, Title } from '@tasenor/common-ui'
import dayjs from 'dayjs'
import { MenuItem, TextField } from '@mui/material'
import Catalog from '../Stores/Catalog'
import { haveCursor, haveSettings } from '@tasenor/common'
import i18n from '../i18n'
import withRouter from '../Hooks/withRouter'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'

@withRouter
@withTranslation('translations')
@withStore
@withCatalog
@observer
class ToolsToolPanel extends Component {

  state = {
    askNewPeriod: false,
    periodStartDate: null,
    periodEndDate: null,
    askUpload: false,
    askNew: false,
    schemeSelected: '',
    databaseName: '',
    companyName: '',
    companyCode: '',
    changed: false,
    code: null,
    currency: haveSettings().get('currency') || this.props.catalog.getCurrencies()[0],
    files: []
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
    const tool = this.props.params.tool
    if (!tool || tool === 'databases') {
      this.setState({ askNew: true })
      return { preventDefault: true }
    }
  }

  keyIconU() {
    const tool = this.props.params.tool
    if (!tool || tool === 'databases') {
      this.setState({ askUpload: true })
      return { preventDefault: true }
    }
  }

  /**
   * Create new period.
   */
  @action.bound
  async createPeriod(startDate, endDate) {
    const { store, catalog, t } = this.props
    const realStartDate = catalog.str2date(startDate)
    if (!realStartDate) {
      store.addError(t('Invalid start date.'))
      return
    }
    const realEndDate = catalog.str2date(endDate)
    if (!realEndDate) {
      store.addError(t('Invalid end date.'))
      return
    }
    await store.database.createNewPeriod(realStartDate, realEndDate, this.props.t('Initial balance'))
    await store.fetchPeriods(store.db)
  }

  /**
   * Upload selected file.
   */
  @action.bound
  uploadFile() {
    if (this.state.files[0]) {
      this.props.store.request('/db/upload', 'POST', null, this.state.files[0])
        .then(() => {
          this.setState({ askUpload: false })
          this.props.store.clearAccount()
          this.props.store.fetchDatabases(true)
        })
    }
  }

  /**
   * Create new database.
   */
  @action.bound
  onCreateNewDb() {
    const settings = this.props.catalog.getPluginDefaults(false)
    settings.currency = this.state.currency
    settings.language = i18n.language

    if (this.validDbName(this.state.databaseName)) {
      this.props.store.createDatabase({
        databaseName: this.state.databaseName,
        companyName: this.state.companyName,
        companyCode: this.state.companyCode,
        scheme: this.state.schemeSelected,
        settings
      })
        .then((res) => {
          if (res) {
            const dbName = this.state.databaseName
            this.setState({ askNew: false, databaseName: '', companyName: '', companyCode: '' })
            this.props.navigate(`/${dbName}/tools///periods`)
          }
        })
    }
  }

  onChangeCompanyName(name) {
    const databaseName = name.toLowerCase().replace(/ /g, '_').replace(/[^0-9a-z_]/g, '')
    this.setState({ databaseName, changed: true, companyName: name })
  }

  validDbName(name) {
    return /^[0-9a-z_]+$/.test(name)
  }

  render() {
    const { t, store, catalog } = this.props
    const tool = this.props.params.tool

    if (!store.isLoggedIn()) {
      return ''
    }

    const pluginPanel = catalog.renderToolTopPanel(tool)
    if (pluginPanel) {
      return pluginPanel
    }

    const schemes = catalog.getAccountingSchemes()

    const buttons = []
    let label
    let startDate, endDate

    switch (tool) {
      case 'periods':
        label = 'Periods'
        if (store.database && store.database.periods.length) {
          startDate = dayjs(store.database.periods[store.database.periods.length - 1].end_date).add(1, 'day').format('YYYY-MM-DD')
          endDate = dayjs(store.database.periods[store.database.periods.length - 1].end_date).add(1, 'year').format('YYYY-MM-DD')
        } else {
          startDate = dayjs().startOf('year').format('YYYY-MM-DD')
          endDate = dayjs().startOf('year').add(1, 'year').add(-1, 'day').format('YYYY-MM-DD')
        }
        if (this.props.store.db) {
          buttons.push(
            <IconButton
              id="Create Period"
              key="button-new"
              onClick={() => this.setState({
                askNewPeriod: true,
                periodStartDate: catalog.date2str(startDate),
                periodEndDate: catalog.date2str(endDate)
              })}
              title="create-period"
              icon="calendar-plus"
            />
          )
        }
        break

      default:
        label = 'Database Management'
        buttons.push(
          <IconButton id="New Database" key="button-new-database" disabled={this.props.catalog.getCurrencies().length === 0 || Object.keys(schemes).length === 0} shortcut="A" pressKey="IconA" title="new-database" icon="database"></IconButton>
        )
        buttons.push(
          <IconButton id="Upload Database" key="button-upload" shortcut="U" pressKey="IconU" title="upload-database" icon="upload"></IconButton>
        )
        break
    }

    return (
      <div>
        {label && <Title><Trans>{label}</Trans></Title>}
        {buttons}
        <Dialog
          className="StartPeriod"
          title={<Trans>Start new period?</Trans>}
          isVisible={this.state.askNewPeriod}
          onClose={() => { this.setState({ askNewPeriod: false }) }}
          onConfirm={() => this.createPeriod(this.state.periodStartDate, this.state.periodEndDate)}>
          <TextField
            name="startDate"
            style={{ width: '50%' }}
            data-cy="text-Start Date"
            label={<Trans>Start Date</Trans>}
            value={this.state.periodStartDate}
            onChange={(event) => (this.setState({ periodStartDate: event.target.value }))}
          />
          <TextField
            name="endDate"
            style={{ width: '50%' }}
            data-cy="text-End Date"
            label={<Trans>End Date</Trans>}
            value={this.state.periodEndDate}
            onChange={(event) => (this.setState({ periodEndDate: event.target.value }))}
          />
        </Dialog>

        <Dialog
          className="UploadDatabase"
          title={<Trans>Upload Database</Trans>}
          isVisible={this.state.askUpload}
          onClose={() => { this.setState({ askUpload: false }) }}
          onConfirm={() => this.uploadFile()}>
          <Trans>You can upload backup file here.</Trans>
          <TextField type="file" onChange={(e) => this.setState({ files: e.target.files })}/>
          <br />
          <br />
          <Trans>Note that a database with the same name is overridden automatically.</Trans>
        </Dialog>

        <Dialog
          wider
          className="CreateDatabase"
          title={<Trans>Create New Database</Trans>}
          isVisible={this.state.askNew}
          isValid={() => this.validDbName(this.state.databaseName) && this.state.companyName}
          onClose={() => { this.setState({ askNew: false }) }}
          onConfirm={() => this.onCreateNewDb()}>
          <div>
            <TextField
              fullWidth
              name="scheme"
              data-cy="dropdown-Accounting Scheme"
              label={<Trans>Accounting Scheme</Trans>}
              value={this.state.schemeSelected}
              onChange={(e) => this.setState({ changed: true, schemeSelected: e.target.value })}
              error={this.state.changed && !this.state.schemeSelected}
              helperText={this.state.changed && !this.state.schemeSelected ? t('Accounting scheme is required.') : ''}
              select
            >
              <MenuItem value=""></MenuItem>
              {Object.entries(schemes).map(([k, v]) => <MenuItem key={k} value={k}>{t(v)}</MenuItem>)}
            </TextField>
            <br/>
            <TextField
              fullWidth
              name="company-name"
              data-cy="text-Company Name"
              label={<Trans>Company Name</Trans>}
              value={this.state.companyName}
              onChange={(e) => this.onChangeCompanyName(e.target.value)}
              error={this.state.changed && !this.state.companyName}
              helperText={this.state.changed && !this.state.companyName ? t('Company name is required.') : ''}
            />
            <br/>
            <TextField
              fullWidth
              name="company-number"
              data-cy="text-Company Registration Number"
              label={<Trans>Company Registration Number</Trans>}
              value={this.state.companyCode}
              onChange={(e) => this.setState({ changed: true, companyCode: e.target.value })}
            />
            <br/>
            <TextField
              fullWidth
              select
              name="currency"
              data-cy="dropdown-Currency"
              label={<Trans>Currency</Trans>}
              value={this.state.currency}
              onChange={(e) => this.setState({ changed: true, currency: e.target.value })}
            >
              { this.props.catalog.getCurrencies().map(currency => <MenuItem value={currency} key={currency}>{currency}</MenuItem>) }
            </TextField>
            <TextField
              fullWidth
              name="database-name"
              data-cy="text-Database Name"
              label={<Trans>Database Name</Trans>}
              value={this.state.databaseName}
              onChange={(e) => this.setState({ changed: true, databaseName: e.target.value })}
              error={this.state.changed && (!this.state.databaseName || !this.validDbName(this.state.databaseName))}
              helperText={this.state.changed && (
                !this.state.databaseName
                  ? t('Database name is required.')
                  : (!this.validDbName(this.state.databaseName) ? t('Invalid database name.') : '')
              )}
            />
            <br/>
          </div>
        </Dialog>
      </div>
    )
  }
}

ToolsToolPanel.propTypes = {
  t: PropTypes.func,
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store),
  catalog: PropTypes.instanceOf(Catalog),
}

export default ToolsToolPanel
