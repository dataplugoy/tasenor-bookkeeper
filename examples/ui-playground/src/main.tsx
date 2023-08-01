import { Catalog, Knowledge, Store, setGlobalComponents } from '@tasenor/common'
import { ThemeProvider } from '@mui/material'
import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { RISPProvider } from '@tasenor/common-ui'
import App from './App'
// import { CursorMock, MockCatalog, MockStore, SettingsMock } from './mocks'
import { MockCursor, MockCatalog, MockStore, MockSettings } from '@tasenor/testing'
import theme from './theme'

const store: Store = new MockStore() as unknown as Store // Need to force for now
const catalog: Catalog = new MockCatalog() as unknown as Catalog // Need to force for now
const cursor = new MockCursor()
const settings = new MockSettings()
const knowledge = new Knowledge()

setGlobalComponents(store, catalog, cursor, settings, knowledge)

ReactDOM.render(
  <BrowserRouter>
    <RISPProvider>
      <ThemeProvider theme={theme}>
        <App/>
      </ThemeProvider>
    </RISPProvider>
  </BrowserRouter>,
  document.getElementById('app')
)
