import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'mobx-react'
import App from './App'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import i18n, { initializeI18n } from './i18n'
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material'
import { light, dark } from './theme'
import { RISPProvider } from '@tasenor/common-ui'
import Loading from './Components/Loading'
import withStore from './Hooks/withStore'
import withCatalog from './Hooks/withCatalog'

import { store, cursor, settings, catalog, knowledge } from './globals'

const AppRenderer = withCatalog(withStore((props) => {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  useEffect(async () => {
    await props.store.fetchSettings()
    await initializeI18n(catalog, props.store)
    const data = await props.store.request('/knowledge')
    knowledge.update(data)
    // TODO: Get rid of this once we have properly refactored catalog.
    catalog.connectProps({ navigate })
    setLoading(false)
  }, [])

  if (loading) {
    return <Loading visible={true}/>
  }
  return (
    <ThemeProvider theme={prefersDarkMode ? dark : light}>
      <CssBaseline/>
      <I18nextProvider i18n={ i18n }><App /></I18nextProvider>
    </ThemeProvider>
  )
}))

ReactDOM.render(
  <RISPProvider
    onBlur={() => cursor.enableHandler()}
    onFocus={() => cursor.disableHandler()}
  >
    <Provider store={store} cursor={cursor} settings={settings} catalog={catalog}>
      <BrowserRouter>
        <AppRenderer />
      </BrowserRouter>
    </Provider>
  </RISPProvider>,
  document.getElementById('app')
)
