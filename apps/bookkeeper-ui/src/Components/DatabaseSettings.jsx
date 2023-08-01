import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import { Title, SubPanel } from '@tasenor/common-ui'
import Panel from './Panel'
import { withTranslation, Trans } from 'react-i18next'
import SubTitle from './SubTitle'
import { haveSettings } from '@tasenor/common'
import withStore from '../Hooks/withStore'

@withStore
@withTranslation('translations')
@observer
class DatabaseSettings extends Component {

  render() {

    const { store } = this.props
    const settings = haveSettings()

    if (!store.isLoggedIn()) {
      return ''
    }

    return (
      <div className="DatabaseSettings">
        <Title><Trans>Database Settings</Trans></Title>
        <Panel>
          <SubPanel>
            <Title><Trans>Fixed Settings</Trans></Title>
            <SubTitle>
              <Trans>Name</Trans>
            </SubTitle>
            &nbsp; {store.db}
            <SubTitle>
              <Trans>Accounting Scheme</Trans>
            </SubTitle>
            &nbsp; {settings.get('scheme')}
            <SubTitle>
              <Trans>Accounting Scheme Version</Trans>
            </SubTitle>
            &nbsp; {settings.get('schemeVersion')}
            <SubTitle>
              <Trans>Language</Trans>
            </SubTitle>
            &nbsp; {settings.get('language')}
            <SubTitle>
              <Trans>Currency</Trans>
            </SubTitle>
            &nbsp; {settings.get('currency')}
          </SubPanel>
        </Panel>
      </div>
    )
  }
}

DatabaseSettings.propTypes = {
  store: PropTypes.instanceOf(Store),
  t: PropTypes.func
}

export default DatabaseSettings
