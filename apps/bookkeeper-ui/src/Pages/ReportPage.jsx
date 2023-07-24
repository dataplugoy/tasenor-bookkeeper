import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import ReportDisplay from '../Components/ReportDisplay'
import withStore from '../Hooks/withStore'
import withRouter from '../Hooks/withRouter'

@withRouter
@withStore
@observer
class ReportPage extends Component {

  componentDidMount() {
    const { db, periodId, format } = this.props.params
    this.props.store.fetchReport(db, periodId, format)
  }

  componentDidUpdate() {
    const { db, periodId, format } = this.props.params
    this.props.store.fetchReport(db, periodId, format)
  }

  render() {

    if (!this.props.store.isLoggedIn()) {
      return ''
    }

    return (
      <div className="ReportsPage">
        {this.props.store.report && <ReportDisplay report={this.props.store.report}></ReportDisplay>}
      </div>
    )
  }
}

ReportPage.propTypes = {
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store)
}
export default ReportPage
