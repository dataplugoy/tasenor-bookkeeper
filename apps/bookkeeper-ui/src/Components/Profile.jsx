import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import { Title, SubPanel } from '@tasenor/common-ui'
import Panel from './Panel'
import { Trans } from 'react-i18next'
import SubTitle from './SubTitle'
import withStore from '../Hooks/withStore'

@withStore
@observer
class Profile extends Component {

  componentDidMount() {
    this.props.store.fetchCurrentUser()
  }

  render() {

    const { store } = this.props
    const { user } = store
    if (!store.isLoggedIn()) {
      return ''
    }

    return (
      <div className="Profile">
        <Title><Trans>User Profile</Trans></Title>
        <Panel>
          <SubPanel>
            <Title><Trans>Personal Information</Trans></Title>
            <SubTitle>
              <Trans>User name</Trans>
            </SubTitle>
            {user.name}
            <SubTitle>
              <Trans>Email</Trans>
            </SubTitle>
            {user.email}
          </SubPanel>
        </Panel>
      </div>
    )
  }
}

Profile.propTypes = {
  store: PropTypes.instanceOf(Store),
}

export default Profile
