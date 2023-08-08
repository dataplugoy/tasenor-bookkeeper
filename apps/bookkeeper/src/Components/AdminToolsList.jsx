import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import ListComponent from './ListComponent'
import { haveCursor } from '@tasenor/common'
import withRouter from '../Hooks/withRouter'
import withStore from '../Hooks/withStore'

@withRouter
@withTranslation('translations')
@withStore
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
  params: PropTypes.object,
  store: PropTypes.instanceOf(Store)
}

export default AdminToolsList
