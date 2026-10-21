import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { Trans, useTranslation } from 'react-i18next'
import LoginForm from '../Components/LoginForm'
import RegisterForm from '../Components/RegisterForm'
import { Box, Typography } from '@mui/material'
import withStore from '../Hooks/withStore'
import withCatalog from '../Hooks/withCatalog'
import { Link, useNavigate } from 'react-router-dom'

const LoginPage = withStore(withCatalog(observer((props) => {
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
          const { db, periodId } = props.store.user.config
          if (db) {
            if (periodId) {
              navigate(`/${db}/txs/${periodId}`)
            } else {
              navigate(`/${db}`)
            }
          } else {
            navigate(`/${props.store.dbs[0].name}`)
          }
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
          if (data && data.hasAdminUser) {
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
      <Box className="LoginPage">
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}><Trans>Login</Trans></Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {t('Welcome to {{product}}', { product: 'Tasenor' })}
        </Typography>

        <LoginForm onLogin={onLogin}/>

        {introduction && (
          <Box className="LoginIntroduction">
            {introduction.split('\n').map((line, idx) => (
              <Typography key={idx} variant="body2" color="text.secondary">
                {line}
              </Typography>
            ))}
          </Box>
        )}
        <Box sx={{ mt: 2 }}>
          <Link to="https://docs.stg.tasenor.com">
            <Trans>Online Documentation</Trans>
          </Link>
        </Box>
      </Box>
    )
  }

  if (state === 'NO_ROOT') {
    return (
      <Box className="LoginPage">
        <Typography variant="h4" component="h1" sx={{ mb: 1 }}><Trans>This system has no admin user</Trans></Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          <Trans>Please register an admin user</Trans>
        </Typography>
        <RegisterForm onRegister={onRegisterAdmin}/>
      </Box>
    )
  }

  return <></>
})))

export default LoginPage
