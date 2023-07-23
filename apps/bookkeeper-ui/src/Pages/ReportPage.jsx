import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import ReportDisplay from '../Components/ReportDisplay'
import withStore from '../Hooks/withStore'

@withStore
@observer
class ReportPage extends Component {

  componentDidMount() {
    const { db, periodId, format } = this.props.match.params
    this.props.store.fetchReport(db, periodId, format)
  }

  componentDidUpdate() {
    const { db, periodId, format } = this.props.match.params
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
  match: PropTypes.object,
  store: PropTypes.instanceOf(Store)
}
export default ReportPage
