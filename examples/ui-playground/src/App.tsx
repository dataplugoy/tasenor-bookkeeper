import React from 'react'
import { Button, Paper } from '@mui/material'
import { observer } from 'mobx-react'
import PageCurrency from './PageCurrency'
import PageDialog from './PageDialog'
import PageTagGroup from './PageTagGroup'
import { useNavigation } from '@dataplug/tasenor-common-ui'
import PageTabs from './PageTabs'
import PageRuleEditor from './PageRuleEditor'
import PageJsonEditor from './PageJsonEditor'

/**
 * Playground for stuff.
 */
const App = observer(() => {
  const nav = useNavigation()
  return (
    <Paper style={{ margin: '1rem', padding: '1rem' }} elevation={4}>
      <Button onClick={() => nav.go({ indirect: 'yes', side: 'currency' })}>Currency</Button>&nbsp;|&nbsp;
      <Button onClick={() => nav.go({ indirect: 'yes', side: 'dialog' })}>Dialog</Button>&nbsp;|&nbsp;
      <Button onClick={() => nav.go({ indirect: 'yes', side: 'tagGroup' })}>Tag Group</Button>&nbsp;|&nbsp;
      <Button onClick={() => nav.go({ indirect: 'yes', side: 'tabs' })}>Tabs</Button>&nbsp;|&nbsp;
      <Button onClick={() => nav.go({ indirect: 'yes', side: 'ruleEditorSingle' })}>Rule Editor</Button>&nbsp;|&nbsp;
      <Button onClick={() => nav.go({ indirect: 'yes', side: 'jsonEditor' })}>JSON Editor</Button>&nbsp;|&nbsp;
      <hr/>
      {JSON.stringify(nav)}
      <hr/>
      { nav.side === 'currency' && <PageCurrency/> }
      { nav.side === 'dialog' && <PageDialog/> }
      { nav.side === 'tagGroup' && <PageTagGroup/> }
      { nav.side === 'tabs' && <PageTabs/> }
      { nav.side === 'ruleEditorSingle' && <PageRuleEditor/> }
      { nav.side === 'jsonEditor' && <PageJsonEditor/> }
    </Paper>
  )
})

export default App
