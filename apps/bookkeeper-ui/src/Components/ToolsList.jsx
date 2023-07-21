import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer } from 'mobx-react'
import { withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import Catalog from '../Stores/Catalog'
import ListComponent from './ListComponent'
import { haveCursor } from '@dataplug/tasenor-common'
import withRouter from '../Hooks/withRouter'

@withRouter
@withTranslation('translations')
@inject('store')
@inject('catalog')
@observer
class ToolsList extends ListComponent {

  componentDidMount() {
    const cursor = haveCursor()
    cursor.selectPage('Tools', this)
  }

  keyText(cursor, key) {
    const { store, catalog } = this.props
    if (key === '1') {
      this.props.history.push(this.url('tools', 'databases'))
      return { preventDefault: true }
    }
    if (key === '2' && store.db) {
      this.props.history.push(this.url('tools', 'periods'))
      return { preventDefault: true }
    }
    if (catalog.keyPress('tool', key)) {
      return { preventDefault: true }
    }
  }

  getMenu() {
    const { catalog, store } = this.props
    const menu = [{
      page: 'tools',
      id: 'databases',
      title: 'Databases',
      disabled: () => false,
      default: true
    }, {
      page: 'tools',
      id: 'periods',
      title: 'Periods',
      disabled: () => !store.db
    }]
    return menu.concat(catalog.getToolMenu().map(menu => ({
      page: 'tools',
      id: menu.code,
      title: menu.title,
      disabled: () => menu.disabled
    })))
  }

  render() {
    return this.renderMenu('Tools', 'tool')
  }
}

ToolsList.propTypes = {
  match: PropTypes.object,
  history: ReactRouterPropTypes.history.isRequired,
  store: PropTypes.instanceOf(Store),
  catalog: PropTypes.instanceOf(Catalog)
}

export default ToolsList
