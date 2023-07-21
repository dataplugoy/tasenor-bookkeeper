import React from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer } from 'mobx-react'
import { Trans, withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import Catalog from '../Stores/Catalog'
import ListComponent from './ListComponent'
import { Title, Note } from '@dataplug/tasenor-common-ui'
import { haveCursor } from '@dataplug/tasenor-common'
import withRouter from '../Hooks/withRouter'

@withRouter
@withTranslation('translations')
@inject('store')
@inject('catalog')
@observer
class ToolsList extends ListComponent {

  state = {
    importers: []
  }

  componentDidMount() {
    const cursor = haveCursor()
    cursor.selectPage('Import', this)
    this.update()
  }

  componentDidUpdate(oldProps) {
    if (oldProps.match.params.importerId !== this.props.match.params.importerId) {
      this.update()
    }
  }

  update() {
    const { store, match } = this.props
    store.fetchImporters(match.params.db).then(importers => this.setState({ importers }))
  }

  getMenu() {
    return this.state.importers.map(importer => ({
      page: 'data',
      id: importer.id,
      title: importer.name,
      disabled: () => false,
      default: false
    }))
  }

  render() {
    if (this.state.importers && this.state.importers.length) {
      return this.renderMenu('Importers', 'importerId')
    }
    return (
      <div>
        <Title><Trans>Importers</Trans></Title>
        <Note><Trans>There are no importers configured.</Trans></Note>
      </div>
    )
  }
}

ToolsList.propTypes = {
  match: PropTypes.object,
  history: ReactRouterPropTypes.history.isRequired,
  store: PropTypes.instanceOf(Store),
  catalog: PropTypes.instanceOf(Catalog)
}

export default ToolsList
