import React, { useEffect } from 'react'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import ReportDisplay from '../Components/ReportDisplay'
import withStore from '../Hooks/withStore'
import { useParams } from 'react-router-dom'
import { Box } from '@mui/material'

interface ReportPageProps {
  store: Store
}

const ReportPage = withStore(observer((props: ReportPageProps): JSX.Element => {
  const { store } = props

  const params = useParams()
  const { db, periodId, accountId, format } = params

  useEffect(() => {
    if (accountId) {
      store.setAccount(db, periodId, accountId).then(() => store.fetchReport(db, periodId, format))
    } else {
      store.setPeriod(db, periodId).then(() => store.fetchReport(db, periodId, format))
    }
  }, [params])

  if (!store.isLoggedIn()) {
    return <></>
  }

  return <Box className="ReportsPage">
    {store.report && <ReportDisplay report={store.report}></ReportDisplay>}
  </Box>
}))

export default ReportPage
