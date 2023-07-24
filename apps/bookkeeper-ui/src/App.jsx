import './App.css'

import React, { Component } from 'react'
import { Route, Routes } from 'react-router-dom'
import { observer } from 'mobx-react'
import { Alert, Paper } from '@mui/material'
// import Account from './Components/Account'
// import AccountsPage from './Pages/AccountsPage'
// import AccountsToolPanel from './Components/AccountsToolPanel'
import AdminPage from './Pages/AdminPage'
import AdminToolPanel from './Components/AdminToolPanel'
import AdminToolsList from './Components/AdminToolsList'
// import Balances from './Components/Balances'
import Configuration from './Configuration'
import DashboardPage from './Pages/DashboardPage'
import DatabaseList from './Components/DatabaseList'
// import ImportList from './Components/ImportList'
// import ImportPage from './Pages/ImportPage'
// import ImportToolPanel from './Components/ImportToolPanel'
import LoginPage from './Pages/LoginPage'
import LoginSidePanel from './Components/LoginSidePanel'
import Menu from './Components/Menu'
import Messages from './Components/Messages'
// import ReportPage from './Pages/ReportPage'
// import ReportsList from './Components/ReportsList'
// import ReportToolPanel from './Components/ReportToolPanel'
import SettingsList from './Components/SettingsList'
import SettingsPage from './Pages/SettingsPage'
// import ShopPage from './Pages/ShopPage'
import { haveStore } from '@dataplug/tasenor-common'
// import Subscriptions from './Components/Subscriptions'
import ToolsList from './Components/ToolsList'
import ToolsPage from './Pages/ToolsPage'
import ToolsToolPanel from './Components/ToolsToolPanel'
// import TransactionsPage from './Pages/TransactionsPage'
// import TransactionToolPanel from './Components/TransactionToolPanel'

@observer
class App extends Component {

  render() {
    const store = haveStore()

    return (
      <div className="App">
        <Messages />
        <div className="TopPanel Panel">
          <Routes>
            <Route exact path="/" element={<Menu/>}/>
            <Route exact path="/:db/admin/:periodId/:accountId/:tool" element={<Menu/>}/>
            <Route exact path="/:db/admin/:periodId/:accountId" element={<Menu/>}/>
            <Route exact path="/:db/admin//:accountId/:tool" element={<Menu/>}/>
            <Route exact path="/:db/admin/:periodId//:tool" element={<Menu/>}/>
            <Route exact path="/:db/admin/:periodId" element={<Menu/>}/>
            <Route exact path="/:db/admin///:tool" element={<Menu/>}/>
            <Route exact path="/:db/admin" element={<Menu/>}/>
            <Route exact path="/:db" element={<Menu/>}/>
            <Route exact path="/:db/dashboard" element={<Menu/>}/>
            <Route exact path="/:db/dashboard/:periodId" element={<Menu/>}/>
            <Route exact path="/:db/dashboard/:periodId/:accountId" element={<Menu/>}/>
            <Route exact path="/:db/txs/:periodId" element={<Menu/>}/>
            <Route exact path="/:db/txs/:periodId/:accountId" element={<Menu/>}/>
            <Route exact path="/:db/account" element={<Menu/>}/>
            <Route exact path="/:db/account/:periodId" element={<Menu/>}/>
            <Route exact path="/:db/account/:periodId/:accountId" element={<Menu/>}/>
            <Route exact path="/:db/report/:periodId" element={<Menu/>}/>
            <Route exact path="/:db/report/:periodId/:accountId" element={<Menu/>}/>
            <Route exact path="/:db/report/:periodId//:format" element={<Menu/>}/>
            <Route exact path="/:db/report/:periodId/:accountId/:format" element={<Menu/>}/>
            <Route exact path="/:db/tools/:periodId?/:accountId?/:tool?" element={<Menu/>}/>
            <Route exact path="/:db/tools/:periodId//:tool?" element={<Menu/>}/>
            <Route exact path="/:db/tools//:accountId/:tool?" element={<Menu/>}/>
            <Route exact path="/:db/tools///:tool?" element={<Menu/>}/>
            <Route exact path="/:db/data" element={<Menu/>}/>
            <Route exact path="/:db/data/:periodId" element={<Menu/>}/>
            <Route exact path="/:db/data/:periodId/:accountId" element={<Menu/>}/>
            <Route exact path="/:db/data/:periodId//:importerId" element={<Menu/>}/>
            <Route exact path="/:db/data///:importerId" element={<Menu/>}/>
            <Route exact path="/:db/data/:periodId/:accountId/:importerId" element={<Menu/>}/>
            <Route exact path="/:db/settings/:periodId?/:accountId?/:section?" element={<Menu/>}/>
            <Route exact path="/:db/settings/:periodId?//:section?" element={<Menu/>}/>
            <Route exact path="/:db/settings///:section?" element={<Menu/>}/>
            <Route exact path="/:db/shop/:periodId?/:accountId?/:plugin?" element={<Menu/>}/>
            <Route exact path="/:db/shop/:periodId?//:plugin?" element={<Menu/>}/>
            <Route exact path="/:db/shop///:plugin?" element={<Menu/>}/>
          </Routes>
        </div>
        <div className="Page">
          <Paper className="SidePanel Panel" elevation={4}>
            <Routes>
              <Route exact path="/" element={<>{ !store.isLoggedIn() && <LoginSidePanel/>}</>}/>
              <Route exact path="/:db/admin/:periodId/:accountId/:tool" element={<AdminToolsList/>}/>
              <Route exact path="/:db/admin/:periodId/:accountId" element={<AdminToolsList/>}/>
              <Route exact path="/:db/admin//:accountId/:tool" element={<AdminToolsList/>}/>
              <Route exact path="/:db/admin/:periodId//:tool" element={<AdminToolsList/>}/>
              <Route exact path="/:db/admin/:periodId" element={<AdminToolsList/>}/>
              <Route exact path="/:db/admin///:tool" element={<AdminToolsList/>}/>
              <Route exact path="/:db/admin" element={<AdminToolsList/>}/>
              <Route exact path="/" element={<DatabaseList/>}/>
              <Route exact path="/:db" element={<DatabaseList/>}/>
              <Route exact path="/:db/dashboard/:periodId?" element={<DatabaseList/>}/>
              <Route exact path="/:db/dashboard/:periodId/:accountId" element={<DatabaseList/>}/>
              <Route exact path="/:db/settings/:periodId?/:accountId?/:section?" element={<SettingsList/>}/>
              <Route exact path="/:db/settings/:periodId?//:section?" element={<SettingsList/>}/>
              <Route exact path="/:db/settings///:section?" element={<SettingsList/>}/>
              <Route exact path="/:db/tools/:periodId?/:accountId?/:tool?" element={<ToolsList/>}/>
              <Route exact path="/:db/tools/:periodId//:tool?" element={<ToolsList/>}/>
              <Route exact path="/:db/tools//:accountId/:tool?" element={<ToolsList/>}/>
              <Route exact path="/:db/tools///:tool?" element={<ToolsList/>}/>
            </Routes>
          </Paper>
          <div className="MainArea">
            <Paper className="MainTopPanel Panel" elevation={4}>
              {store.motd && <Alert variant="filled" severity="error"><b>{store.motd}</b></Alert>}
              <Routes>
                <Route exact path="/" element={<></>}/>
                <Route exact path="/:db/admin/:periodId/:accountId/:tool" element={<AdminToolPanel/>}/>
                <Route exact path="/:db/admin/:periodId/:accountId" element={<AdminToolPanel/>}/>
                <Route exact path="/:db/admin//:accountId/:tool" element={<AdminToolPanel/>}/>
                <Route exact path="/:db/admin/:periodId//:tool" element={<AdminToolPanel/>}/>
                <Route exact path="/:db/admin/:periodId" element={<AdminToolPanel/>}/>
                <Route exact path="/:db/admin///:tool" element={<AdminToolPanel/>}/>
                <Route exact path="/:db/admin" element={<AdminToolPanel/>}/>
                <Route exact path="/:db/dashboard" element={<></>}/>
                <Route exact path="/:db/tools/:periodId?/:accountId?/:tool?" element={<ToolsToolPanel/>}/>
                <Route exact path="/:db/tools/:periodId//:tool?" element={<ToolsToolPanel/>}/>
                <Route exact path="/:db/tools//:accountId/:tool?" element={<ToolsToolPanel/>}/>
                <Route exact path="/:db/tools///:tool?" element={<ToolsToolPanel/>}/>
                <Route exact path="/:db/settings/:periodId?/:accountId?/:section?" element={<></>}/>
                <Route exact path="/:db/settings/:periodId?//:section?" element={<></>}/>
                <Route exact path="/:db/settings///:section?" element={<></>}/>
              </Routes>
            </Paper>
            <Paper className="MainPanel Panel" elevation={4}>
              <Routes>
                <Route exact path="/" element={<LoginPage/>}/>
                <Route exact path="/:db/admin/:periodId/:accountId/:tool" element={<AdminPage/>}/>
                <Route exact path="/:db/admin/:periodId/:accountId" element={<AdminPage/>}/>
                <Route exact path="/:db/admin//:accountId/:tool" element={<AdminPage/>}/>
                <Route exact path="/:db/admin/:periodId//:tool" element={<AdminPage/>}/>
                <Route exact path="/:db/admin/:periodId" element={<AdminPage/>}/>
                <Route exact path="/:db/admin///:tool" element={<AdminPage/>}/>
                <Route exact path="/:db/admin" element={<AdminPage/>}/>
                <Route exact path="/" element={<DashboardPage/>}/>
                <Route exact path="/:db" element={<DashboardPage/>}/>
                <Route exact path="/:db/dashboard" element={<DashboardPage/>}/>
                <Route exact path="/:db/dashboard/:periodId" element={<DashboardPage/>}/>
                <Route exact path="/:db/dashboard/:periodId/:accountId" element={<DashboardPage/>}/>
                <Route exact path="/:db/tools/:periodId?/:accountId?/:tool?" element={<ToolsPage/>}/>
                <Route exact path="/:db/tools/:periodId//:tool?" element={<ToolsPage/>}/>
                <Route exact path="/:db/tools//:accountId/:tool?" element={<ToolsPage/>}/>
                <Route exact path="/:db/tools///:tool?" element={<ToolsPage/>}/>
                <Route exact path="/:db/settings/:periodId?/:accountId?/:section?" element={<SettingsPage/>}/>
                <Route exact path="/:db/settings/:periodId?//:section?" element={<SettingsPage/>}/>
                <Route exact path="/:db/settings///:section?" element={<SettingsPage/>}/>
              </Routes>
            </Paper>
            <div className={`Version ${store.isLoggedIn() ? 'logged-in' : 'not-logged-in'}`} style={{ color: 'rgb(0,0,0,0.5)', fontSize: '0.6rem', position: 'absolute', right: '2px', bottom: '2px' }}>v{Configuration.VERSION}</div>
          </div>
        </div>
      </div>
    )
    /*
    return (
      <div className="App">
        <div className="Page">
          <Paper className="SidePanel Panel" elevation={4}>
            <Route path="/:db/txs/:periodId" element={<Balances/>}/>
            <Route exact path="/:db/report/:periodId" element={<ReportsList/>}/>
            <Route exact path="/:db/report/:periodId/:accountId" element={<ReportsList/>}/>
            <Route exact path="/:db/report/:periodId/:accountId/:format" element={<ReportsList/>}/>
            <Route exact path="/:db/report/:periodId//:format" element={<ReportsList/>}/>
            <Route path="/:db/account/:periodId?/:accountId?" element={<Account/>}/>
            <Route exact path="/:db/data" element={<ImportList/>}/>
            <Route exact path="/:db/data/:periodId" element={<ImportList/>}/>
            <Route exact path="/:db/data/:periodId/:accountId" element={<ImportList/>}/>
            <Route exact path="/:db/data/:periodId//:importerId" element={<ImportList/>}/>
            <Route exact path="/:db/data///:importerId" element={<ImportList/>}/>
            <Route exact path="/:db/data/:periodId/:accountId/:importerId" element={<ImportList/>}/>
            <Route exact path="/:db/shop/:periodId?/:accountId?/:plugin?" element={<Subscriptions/>}/>
            <Route exact path="/:db/shop/:periodId?//:plugin?" element={<Subscriptions/>}/>
            <Route exact path="/:db/shop///:plugin?" element={<Subscriptions/>}/>
          </Paper>
          <div className="MainArea">
            <Paper className="MainTopPanel Panel" elevation={4}>
              <Route path="/:db/txs/:periodId/:accountId?" element={<TransactionToolPanel/>}/>
              <Route exact path="/:db/report/:periodId" element={<ReportToolPanel/>}/>
              <Route exact path="/:db/report/:periodId/:accountId" element={<ReportToolPanel/>}/>
              <Route exact path="/:db/report/:periodId/:accountId/:format" element={<ReportToolPanel/>}/>
              <Route exact path="/:db/report/:periodId//:format" element={<ReportToolPanel/>}/>
              <Route path="/:db/account/:periodId?" element={<AccountsToolPanel/>}/>
              <Route exact path="/:db/data" element={<ImportToolPanel/>}/>
              <Route exact path="/:db/data/:periodId" element={<ImportToolPanel/>}/>
              <Route exact path="/:db/data/:periodId/:accountId" element={<ImportToolPanel/>}/>
              <Route exact path="/:db/data/:periodId//:importerId" element={<ImportToolPanel/>}/>
              <Route exact path="/:db/data///:importerId" element={<ImportToolPanel/>}/>
              <Route exact path="/:db/data/:periodId/:accountId/:importerId" element={<ImportToolPanel/>}/>
            </Paper>
            <Paper className="MainPanel Panel" elevation={4}>
              <Route path="/:db/txs/:periodId/:accountId?" element={<TransactionsPage/>}/>
              <Route exact path="/:db/report/:periodId" element={<ReportPage/>}/>
              <Route exact path="/:db/report/:periodId/:accountId" element={<ReportPage/>}/>
              <Route exact path="/:db/report/:periodId/:accountId/:format" element={<ReportPage/>}/>
              <Route exact path="/:db/report/:periodId//:format" element={<ReportPage/>}/>
              <Route path="/:db/account/:periodId?" element={<AccountsPage/>}/>
              <Route exact path="/:db/data" element={<ImportPage/>}/>
              <Route exact path="/:db/data/:periodId" element={<ImportPage/>}/>
              <Route exact path="/:db/data/:periodId/:accountId" element={<ImportPage/>}/>
              <Route exact path="/:db/data/:periodId//:importerId" element={<ImportPage/>}/>
              <Route exact path="/:db/data///:importerId" element={<ImportPage/>}/>
              <Route exact path="/:db/data/:periodId/:accountId/:importerId" element={<ImportPage/>}/>
              <Route exact path="/:db/shop/:periodId?/:accountId?/:plugin?" element={<ShopPage/>}/>
              <Route exact path="/:db/shop/:periodId?//:plugin?" element={<ShopPage/>}/>
              <Route exact path="/:db/shop///:plugin?" element={<ShopPage/>}/>
            </Paper>
          </div>
        </div>
      </div>
    )
    */
  }
}

export default App
