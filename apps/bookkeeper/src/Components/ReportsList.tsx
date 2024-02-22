import React from 'react'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import { Note } from '@tasenor/common-ui'
import withStore from '../Hooks/withStore'
import { ListMenu } from './ListMenu'
import { Trans, useTranslation } from 'react-i18next'

export type ReportsListProps = {
  store: Store
}

const ReportsList = observer(withStore((props: ReportsListProps): JSX.Element => {
  const { store } = props
  const { t } = useTranslation()

  if (!store.reports.length) {
    return <Note><Trans>There are no report plugins available.</Trans></Note>
  }

  const menu = store.reports.map(report => ({
    page: 'report',
    id: report.format,
    title: t('report-' + report.format),
    disabled: () => false,
    cssId: `SelectReport ${report.format}`
  }))

  return <ListMenu title="Reports" menu={menu} matchVar="format"/>
}))

export default ReportsList