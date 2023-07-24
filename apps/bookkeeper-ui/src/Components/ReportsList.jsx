import React from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { observer } from 'mobx-react'
import { Trans, withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import ListComponent from './ListComponent'
import { haveCursor } from '@dataplug/tasenor-common'
import { Note } from '@dataplug/tasenor-common-ui'
import withStore from '../Hooks/withStore'

@withTranslation('translations')
@withStore
@observer
class ReportsList extends ListComponent {

  componentDidMount() {
    const cursor = haveCursor()
    cursor.selectPage('Reports', this)
  }

  getMenu() {
    const { store, t } = this.props
    return store.reports.map(report => ({
      page: 'report',
      id: report.format,
      title: t('report-' + report.format),
      disabled: () => false,
      cssId: `SelectReport ${report.format}`
    }))
  }

  render() {
    const { store } = this.props
    if (!store.reports.length) {
      return <Note><Trans>There are no report plugins available.</Trans></Note>
    }
    return this.renderMenu('Reports', 'format')
  }
}

ReportsList.propTypes = {
  history: ReactRouterPropTypes.history.isRequired,
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store),
  t: PropTypes.func,
}

export default ReportsList
