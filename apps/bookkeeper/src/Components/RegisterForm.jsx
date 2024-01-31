import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { Trans, withTranslation } from 'react-i18next'
import Store from '../Stores/Store'
import { TextField, Button } from '@mui/material'
import { haveCursor } from '@tasenor/common'
import withStore from '../Hooks/withStore'

@withStore
@withTranslation('translations')
@observer
class RegisterForm extends Component {

  state = {
    name: '',
    email: '',
    password: '',
    passwordAgain: ''
  }

  componentDidMount() {
    const cursor = haveCursor()
    cursor.disableHandler()
  }

  componentWillUnmount = () => {
    const cursor = haveCursor()
    cursor.enableHandler()
  }

  onCancel() {
    this.props.onCancel()
  }

  onRegister() {
    const { store } = this.props
    const { name, email, password, passwordAgain } = this.state
    store.clearMessages()

    if (password.length < 4) {
      store.addError(this.props.t('Password is too short.'))
    }
    if (password !== passwordAgain) {
      store.addError(this.props.t('Passwords do not match.'))
    }
    if (!email) {
      store.addError(this.props.t('Email is required.'))
    }
    if (!name) {
      store.addError(this.props.t('Full name is required.'))
    }

    if (store.messages.length) {
      return
    }

    this.props.onRegister({ name, password, email })
  }

  render() {

    return <form>
        <TextField
          fullWidth
          name="full-name"
          data-cy="text-Full Name"
          label={<Trans>Full Name</Trans>}
          onChange={(event) => (this.setState({ name: event.target.value }))}
        />
        <br/>
        <TextField
          fullWidth
          name="email"
          data-cy="text-Email"
          label={<Trans>Email</Trans>}
          onChange={(event) => (this.setState({ email: event.target.value }))}
        />
        <br/>
        <TextField
          type="password"
          name="password"
          data-cy="text-Password"
          fullWidth
          label={<Trans>Password</Trans>}
          onChange={(event) => (this.setState({ password: event.target.value }))}
        />
        <br/>
        <TextField
          type="password"
          name="password-again"
          data-cy="text-Password Again"
          fullWidth
          label={<Trans>Password Again</Trans>}
          onChange={(event) => (this.setState({ passwordAgain: event.target.value }))}
        />
        <br/>
        <br/>
        <Button
          id="cancel"
          data-cy="button-Cancel"
          variant="outlined"
          disabled={!this.props.onCancel}
          onClick={() => this.onCancel()}
        >
            <Trans>Cancel</Trans>
          </Button>
        &nbsp;
        <Button
          id="submit"
          data-cy="button-Submit"
          variant="outlined"
          onClick={() => this.onRegister()}
        >
          <Trans>Submit</Trans>
        </Button>
    </form>
  }
}

RegisterForm.propTypes = {
  store: PropTypes.instanceOf(Store),
  onCancel: PropTypes.func,
  onRegister: PropTypes.func,
  t: PropTypes.func,
}

export default RegisterForm
