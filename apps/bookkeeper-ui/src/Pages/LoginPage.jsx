import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { observer } from 'mobx-react'
import { Trans, withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import Catalog from '../Stores/Catalog'
import LoginForm from '../Components/LoginForm'
import RegisterForm from '../Components/RegisterForm'
import { Title } from '@dataplug/tasenor-common-ui'
import Panel from '../Components/Panel'
import { Box, Typography } from '@mui/material'
import withRouter from '../Hooks/withRouter'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'

@withRouter
@withTranslation('translations')
@withStore
@withCatalog
@observer
class LoginPage extends Component {

  state = {
    appState: null,
    introduction: ''
  }

  componentDidMount() {
    if (this.props.store.isLoggedIn()) {
      this.setState({ appState: 'LOGGED_IN' })
    } else {
      this.props.store.request('/status')
        .then((data) => {
          if (data.hasAdminUser) {
            this.setState({ appState: 'NOT_LOGGED_IN', introduction: data.introduction || '' })
          } else {
            this.setState({ appState: 'NO_ROOT' })
          }
        })
    }
  }

  componentDidUpdate() {
    if (this.props.store.isLoggedIn()) {
      if (this.state.appState !== 'LOGGED_IN') {
        this.setState({ appState: 'LOGGED_IN' })
      }
    } else {
      if (this.state.appState === 'LOGGED_IN') {
        this.setState({ appState: 'NOT_LOGGED_IN' })
      }
    }
  }

  render() {

    const { store, t, catalog } = this.props

    const onLogin = async ({ user, password, message }) => {
      const success = await store.login(user, password)
      if (success) {
        if (store.isAdmin) {
          this.props.history.push('/_/admin')
        } else {
          if (store.dbs.length) {
            this.props.history.push(`/${store.dbs[0].name}`)
          } else {
            this.props.history.push('/_/tools///databases')
          }
        }
        if (message) {
          store.addMessage(message)
        }
      }
    }

    const onRegisterAdmin = ({ name, password, email }) => {
      return store.request('/register', 'POST', { admin: true, name, password, email })
        .then(() => {
          store.login(email, password)
            .then(() => {
              this.props.history.push('/_/admin')
            })
        })
    }

    const introduction = this.state.introduction[catalog.language()] || this.state.introduction.en

    if (this.state.appState === 'NO_ROOT') {
      return (
        <Box sx={{ backgroundColor: '#fcf9f4', minHeight: '100%' }}>
          <Title><Trans>This system has no admin user</Trans></Title>
          <Panel title={<Trans>Please register an admin user</Trans>}>
            <RegisterForm onRegister={onRegisterAdmin}/>
          </Panel>
        </Box>
      )
    }

    if (this.state.appState === 'NOT_LOGGED_IN') {
      return (
        <Box sx={{ backgroundColor: '#fcf9f4', minHeight: '100%' }}>
          <Title className="LoginPage"><Trans>Login</Trans></Title>
          <Panel title={t('Welcome to {{product}}', { product: 'Tasenor' })}>
          {introduction && introduction.split('\n').map((line, idx) => (
            <Typography key={idx} sx={{ fontSize: 20 }}>
              {line}
            </Typography>
          ))}
          </Panel>
          <LoginForm onLogin={onLogin}/>
        </Box>
      )
    }

    return ''
  }
}

LoginPage.propTypes = {
  store: PropTypes.instanceOf(Store),
  catalog: PropTypes.instanceOf(Catalog),
  history: ReactRouterPropTypes.history,
  t: PropTypes.func
}

export default LoginPage
