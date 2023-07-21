import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'mobx-react'
import App from './App'
import { BrowserRouter, NavigateFunction } from 'react-router-dom'
import Store from './Stores/Store'
import Cursor from './Stores/Cursor'
import Settings from './Stores/Settings'
import Catalog from './Stores/Catalog'
import i18n, { initializeI18n } from './i18n'
import { CircularProgress, Box, ThemeProvider } from '@mui/material'
import theme from './theme'
import { RISPProvider } from '@dataplug/tasenor-common-ui'
import { setGlobalComponents, Knowledge } from '@dataplug/tasenor-common'
import withRouter from './Hooks/withRouter'

const settings = new Settings()
const store = new Store(settings)
const cursor = new Cursor(store)
const catalog = new Catalog(store)
store.setCatalog(catalog)
const knowledge = new Knowledge()

setGlobalComponents(store, catalog, cursor, settings, knowledge)

@withRouter
class AppRenderer extends Component<{ navigate?: NavigateFunction }> {
  state = {
    loading: true
  }

  async componentDidMount() {
    const el = document.getElementById('tasenor-loading')
    if (el) el.remove()
    await initializeI18n(catalog, store)
    await store.fetchSettings()
    const data = await store.request('/knowledge')
    knowledge.update(data)

    catalog.connectProps({ navigate: this.props.navigate })
    this.setState({ loading: false })
  }

  render() {
    if (this.state.loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20%' }}>
          <CircularProgress />
        </Box>
      )
    }
    return <I18nextProvider i18n={ i18n }><App /></I18nextProvider>
  }
}

ReactDOM.render(
  <RISPProvider
    onBlur={() => cursor.enableHandler()}
    onFocus={() => cursor.disableHandler()}
  >
    <ThemeProvider theme={theme}>
      <Provider store={store} cursor={cursor} settings={settings} catalog={catalog}>
        <BrowserRouter>
          <AppRenderer />
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  </RISPProvider>,
  document.getElementById('app')
)