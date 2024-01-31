import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { Trans, useTranslation } from 'react-i18next'
import LoginForm from '../Components/LoginForm'
import RegisterForm from '../Components/RegisterForm'
import { Title } from '@tasenor/common-ui'
import Panel from '../Components/Panel'
import { Box, Typography } from '@mui/material'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'
import { useNavigate } from 'react-router-dom'

const LoginPage = observer(withStore(withCatalog((props) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [state, setState] = useState('')
  const [introduction, setIntroduction] = useState('')

  const onRegisterAdmin = ({ name, password, email }) => {
    return props.store.request('/register', 'POST', { admin: true, name, password, email })
      .then(() => {
        props.store.login(email, password)
          .then(() => {
            navigate('/_/admin')
          })
      })
  }

  const onLogin = async ({ user, password, message }) => {
    const success = await props.store.login(user, password)
    if (success) {
      if (message) {
        props.store.addMessage(message)
      }
      if (props.store.isAdmin) {
        navigate('/_/admin')
      } else {
        if (props.store.dbs.length) {
          navigate(`/${props.store.dbs[0].name}`)
        } else {
          navigate('/_/tools///databases')
        }
      }
    }
  }

  useEffect(() => {
    if (props.store.isLoggedIn()) {
      navigate('/_/dashboard')
    } else {
      props.store.request('/status')
        .then((data) => {
          if (data.hasAdminUser) {
            setState('NOT_LOGGED_IN')
            setIntroduction(data.introduction[props.catalog.language()] || data.introduction.en)
          } else {
            setState('NO_ROOT')
          }
        })
    }
  }, [])

  if (state === 'NOT_LOGGED_IN') {
    return (
      <Box sx={{ minHeight: '100%' }}>
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

  if (state === 'NO_ROOT') {
    return (
      <Box sx={{ minHeight: '100%' }}>
        <Title><Trans>This system has no admin user</Trans></Title>
        <Panel title={<Trans>Please register an admin user</Trans>}>
          <RegisterForm onRegister={onRegisterAdmin}/>
        </Panel>
      </Box>
    )
  }

  return <></>
})))

export default LoginPage
