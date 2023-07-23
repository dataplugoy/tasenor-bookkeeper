import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import { Title, SubPanel, RISP } from '@dataplug/tasenor-common-ui'
import Panel from './Panel'
import { withTranslation, Trans } from 'react-i18next'
import SubTitle from './SubTitle'
import config from '../Configuration'
import { haveSettings } from '@dataplug/tasenor-common'
import withStore from '../Hooks/withStore'

@withStore
@withTranslation('translations')
@observer
class SystemSettings extends Component {

  render() {

    const { store, t } = this.props
    const settings = haveSettings()

    if (!store.isLoggedIn() || !store.isAdmin) {
      return ''
    }

    return (
      <div className="SystemSettings">
        <Title><Trans>System Settings</Trans></Title>
        <Panel>
          <SubPanel>
            <SubTitle><Trans>User Registration</Trans></SubTitle>
            <RISP
              key="SystemSettings"
              element={{
                type: 'flat',
                elements: [
                  {
                    type: 'boolean',
                    name: 'canRegister',
                    defaultValue: false,
                    actions: {}
                  },
                  {
                    type: 'boolean',
                    name: 'isEmailConfirmationRequired',
                    defaultValue: false,
                    actions: {}
                  },
                  {
                    type: 'currency',
                    name: 'currency',
                    actions: {},
                    label: this.props.t('System Currency')
                  },
                  {
                    type: 'button',
                    label: 'Save',
                    actions: {
                      onClick: {
                        type: 'patch',
                        url: '/system/settings',
                        successMessage: t('System settings saved.'),
                        failureMessage: t('Saving system settings failed.')
                      }
                    }
                  }
                ]
              }}
              values={{
                currency: settings.getSystem('currency'),
                canRegister: settings.get('canRegister'),
                isEmailConfirmationRequired: settings.get('isEmailConfirmationRequired')
              }}
              setup={store.rispSetup(config.UI_API_URL)}/>
          </SubPanel>
        </Panel>
      </div>
    )
  }
}

SystemSettings.propTypes = {
  store: PropTypes.instanceOf(Store),
  t: PropTypes.func
}

export default SystemSettings
