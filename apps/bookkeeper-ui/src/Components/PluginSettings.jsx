import { elementNames, haveSettings } from '@dataplug/tasenor-common'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import { Title, SubPanel, RISP } from '@dataplug/tasenor-common-ui'
import Panel from './Panel'
import { Trans } from 'react-i18next'
import Catalog from '../Stores/Catalog'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'

@withStore
@withCatalog
@observer
class PluginSettings extends Component {

  render() {

    const { store, catalog } = this.props
    const settings = haveSettings()

    if (!store.isLoggedIn()) {
      return ''
    }

    // Check UI plugins first.
    let plugin = catalog.getPluginsWithSettings().find(p => p.code === this.props.plugin)
    let element

    if (plugin) {
      element = plugin.getSettings()
    } else {
      for (const p of settings.getPluginSettings()) {
        if (p.code === this.props.plugin) {
          element = p.ui
          plugin = p
          break
        }
      }
    }
    if (!element) {
      return <></>
    }

    const values = {}
    for (const name of elementNames(element)) {
      values[name] = settings.get(`${plugin.code}.${name}`) || null
    }
    const setup = {
      store: this.props.store
    }

    return (
      <div className={`PluginSettings ${plugin.code}`}>
        <Title><Trans>Settings</Trans>: <Trans>{plugin.title}</Trans></Title>
        <Panel>
          <SubPanel>
            <Title><Trans>Settings</Trans></Title>
            <RISP key={plugin.code} element={element} values={values} setup={setup}/>
          </SubPanel>
        </Panel>
      </div>
    )
  }
}

PluginSettings.propTypes = {
  plugin: PropTypes.string,
  store: PropTypes.instanceOf(Store),
  catalog: PropTypes.instanceOf(Catalog),
}

export default PluginSettings
