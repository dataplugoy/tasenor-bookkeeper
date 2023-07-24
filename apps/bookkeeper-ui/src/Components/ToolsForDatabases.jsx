import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import Store from '../Stores/Store'
import { net } from '@dataplug/tasenor-common'
import { Dialog, downloadUrl, Title, Note } from '@dataplug/tasenor-common-ui'
import { Card, CardActions, CardContent, Button, CardHeader, TextField } from '@mui/material'
import { Storage } from '@mui/icons-material'
import Catalog from '../Stores/Catalog'
import Configuration from '../Configuration'
import Panel from './Panel'
import withRouter from '../Hooks/withRouter'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'

@withRouter
@withTranslation('translations')
@withCatalog
@withStore
@observer
class ToolsForDatabases extends Component {

  state = {
    showDeleteDialog: false,
    dbToDelete: null,
    nameInput: ''
  }

  async onDeleteDb() {
    const { store } = this.props
    const deletingCurrent = (store.db === this.state.dbToDelete.name)

    if (this.state.dbToDelete.name !== this.state.nameInput) {
      store.addError(this.props.t('Database name was not given correctly.'))
    } else {
      const db = this.state.dbToDelete
      if (await db.delete()) {
        await store.fetchDatabases(true)
        store.addMessage(this.props.t('Database deleted permanently.'))
        if (deletingCurrent) {
          store.setDb(null)
          this.props.navigate('/_/tools///databases')
        }
      }
    }
  }

  render() {

    const { store, t } = this.props

    if (!store.isLoggedIn()) {
      return ''
    }

    const goto = (db) => {
      this.props.navigate(`/${db.name}`)
    }

    const download = (db) => {
      const token = net.getConf(Configuration.UI_API_URL, 'token')
      downloadUrl(`${Configuration.UI_API_URL}/db/${db.name}/download`, token)
    }

    const noScheme = Object.keys(this.props.catalog.getAccountingSchemes()).length === 0
    const noCurrency = !this.props.catalog.getCurrencies().length
    const canCreate = !noScheme && !noCurrency

    return (
      <div>
        <Title className="ToolsForDatabasesPage"><Trans>Databases</Trans></Title>

        <Note showIf={noScheme}><Trans>Cannot create new databases, since no scheme plugins installed.</Trans></Note>

        <Note showIf={noCurrency}><Trans>Cannot create new databases, since no currencies available.</Trans></Note>

        {canCreate && store.dbs.length === 0 &&
          <Panel title={ t('You have no databases') }>
            <Trans>You need to create or upload a database first.</Trans>
            <Trans>Please click an icon above.</Trans>
          </Panel>
        }

        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {store.dbs.map((db, index) => (
            <Card key={index} style={{ margin: '1rem', width: '20rem' }}>
              <CardHeader className="Database" avatar={<Storage/>} title={<Trans>Database</Trans>} subheader={db.name}/>
              <CardContent>
              </CardContent>
              <CardActions>
                <Button className="ViewDatabase" variant="outlined" color="primary" size="small" onClick={() => goto(db)}><Trans>View</Trans></Button>
                <Button className="DownloadDatabase" variant="outlined" color="primary" size="small" onClick={() => download(db)}><Trans>Download</Trans></Button>
                <Button className="DeleteDatabase" style={{ color: 'red' }} size="small" onClick={() => this.setState({ showDeleteDialog: true, dbToDelete: db, nameInput: '' })}><Trans>Delete</Trans></Button>
              </CardActions>
            </Card>
          ))}
        </div>

        { this.state.showDeleteDialog &&
          <Dialog
            className="DeleteDatabase"
            title={<Trans>Delete this database?</Trans>}
            isVisible={this.state.showDeleteDialog}
            onClose={() => this.setState({ showDeleteDialog: false })}
            onConfirm={() => this.onDeleteDb()}
          >
              <Trans>Deleting the database is irreversible!</Trans><br />
              <Trans>Please type in the database name</Trans> <b>{this.state.dbToDelete.name}</b>
              <TextField
                name="deleted-database-name"
                fullWidth
                label={<Trans>Name</Trans>}
                value={this.state.nameInput}
                onChange={(event) => (this.setState({ nameInput: event.target.value }))}
              />
          </Dialog>
      }
      </div>
    )
  }
}

ToolsForDatabases.propTypes = {
  db: PropTypes.string,
  t: PropTypes.func,
  periodId: PropTypes.string,
  catalog: PropTypes.instanceOf(Catalog),
  store: PropTypes.instanceOf(Store)
}
export default ToolsForDatabases
