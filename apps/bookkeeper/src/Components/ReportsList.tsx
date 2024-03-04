import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import withStore from '../Hooks/withStore'
import { ListMenu } from './ListMenu'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

export type ReportsListProps = {
  store: Store
}

const ReportsList = observer(withStore((props: ReportsListProps): JSX.Element => {
  const { store } = props
  const { t } = useTranslation()
  const params = useParams()
  const { db, periodId, accountId } = params
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    if (accountId) {
      store.setAccount(db, periodId, accountId).then(() => {
        setRefresh(!refresh)
      })
    } else {
      store.setPeriod(db, periodId).then(() => {
        setRefresh(!refresh)
      })
    }
  }, [params])

  const menu = store.reports.map(report => ({
    page: 'report',
    id: report.format,
    title: t('report-' + report.format),
    disabled: () => false,
    cssId: `SelectReport ${report.format}`
  }))

  return <ListMenu title="Reports" menu={menu} matchVar="format" emptyMessage={t('There are no report plugins available.')}/>
}))

export default ReportsList
