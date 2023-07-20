import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer } from 'mobx-react'
import { withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import { withRouter } from 'react-router-dom'
import ListComponent from './ListComponent'
import { haveCursor } from '@dataplug/tasenor-common'

@withRouter
@withTranslation('translations')
@inject('store')
@observer
class AdminToolsList extends ListComponent {

  componentDidMount() {
    const cursor = haveCursor()
    cursor.selectPage('Admin', this)
  }

  getMenu() {
    return [{
      page: 'admin',
      id: 'plugins',
      title: 'Plugins',
      disabled: () => false,
      visible: () => this.props.store.isSuperuser,
      default: true
    }, {
      page: 'admin',
      id: 'users',
      title: 'Users',
      disabled: () => false,
    }]
  }

  render() {
    return this.renderMenu('Admin Tools', 'tool')
  }
}

AdminToolsList.propTypes = {
  match: PropTypes.object,
  history: ReactRouterPropTypes.history.isRequired,
  store: PropTypes.instanceOf(Store)
}

export default AdminToolsList
