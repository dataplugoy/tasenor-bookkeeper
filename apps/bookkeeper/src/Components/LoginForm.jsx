import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Trans, withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import { Box, Stack, TextField, Button, Typography } from '@mui/material'
import RegisterForm from './RegisterForm'
import SubTitle from './SubTitle'
import { haveCursor, haveSettings } from '@tasenor/common'
import withStore from '../Hooks/withStore'

@withStore
@withTranslation('translations')
class LoginForm extends Component {

  state = {
    allowRegistration: false,
    showRegistration: false,
    user: '',
    password: ''
  }

  async componentDidMount() {
    const cursor = haveCursor()
    const settings = haveSettings()
    cursor.disableHandler()
    await this.props.store.fetchSettings()
    if (settings.get('canRegister')) {
      this.setState({ allowRegistration: true })
    }
  }

  componentWillUnmount = () => {
    const cursor = haveCursor()
    cursor.enableHandler()
  }

  onLogin() {
    this.props.onLogin({ user: this.state.user, password: this.state.password })
  }

  onRegister({ user, name, password, email }) {
    return this.props.store.request('/admin/user', 'POST', { user, name, password, email, selfRegistration: true })
      .then(async (res) => {
        if (res) {
          this.setState({ showRegistration: false })
          await this.props.onLogin({ user: email, password, message: this.props.t('User account registered successfully.') })
        } else {
          this.props.store.addError(this.props.t('User account registration failed.'))
        }
      })
      .catch(() => {
        this.setState({ showRegistration: false })
      })
  }

  render() {
    if (this.state.showRegistration) {
      return (
        <Box className="LoginForm">
          <SubTitle><Trans>Register New Account</Trans></SubTitle>
          <RegisterForm
            onCancel={() => this.setState({ showRegistration: false })}
            onRegister={({ user, name, password, email }) => this.onRegister({ user, name, password, email })}
          />
        </Box>
      )
    }

    return (
      <Box className="LoginForm">
        <form onSubmit={(event) => { event.preventDefault(); this.onLogin() }}>
          <Stack spacing={2}>
            <TextField
              name="username"
              autoComplete="username"
              fullWidth
              autoFocus
              data-cy="text-Email"
              label={<Trans>Email</Trans>}
              onChange={(event) => (this.setState({ user: event.target.value }))}
            />
            <TextField
              name="password"
              type="password"
              autoComplete="current-password"
              fullWidth
              data-cy="text-Password"
              label={<Trans>Password</Trans>}
              onChange={(event) => (this.setState({ password: event.target.value }))}
            />
            <Button id="login" data-cy="button-Login" variant="contained" size="large" type="submit" fullWidth><Trans>Login</Trans></Button>
          </Stack>
        </form>
        {
          this.state.allowRegistration &&
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              <Trans>No account yet?</Trans>
              <Button id="Register an account" onClick={() => this.setState({ showRegistration: true })} color="secondary">
                <Trans>Register an account!</Trans>
              </Button>
            </Typography>
        }
      </Box>
    )
  }
}

LoginForm.propTypes = {
  store: PropTypes.instanceOf(Store),
  onLogin: PropTypes.func,
  t: PropTypes.func,
}

export default LoginForm
