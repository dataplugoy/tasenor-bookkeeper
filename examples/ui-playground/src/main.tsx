import { Knowledge, setGlobalComponents } from '@dataplug/tasenor-common'
import { ThemeProvider } from '@mui/material'
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { RISPProvider } from '@dataplug/tasenor-common-ui'
// import App from './App'
// import { CursorMock, MockCatalog, MockStore, SettingsMock } from './mocks'
import theme from './theme'

// const store = new MockStore()
// const catalog = new MockCatalog()
// const cursor = new CursorMock()
// const settings = new SettingsMock()
// const knowledge = new Knowledge()
//
// setGlobalComponents(store, catalog, cursor, settings, knowledge)

ReactDOM.render(
  <BrowserRouter>
    <RISPProvider>
      <ThemeProvider theme={theme}>
        APP
      </ThemeProvider>
    </RISPProvider>
  </BrowserRouter>,
  document.getElementById('app')
)
