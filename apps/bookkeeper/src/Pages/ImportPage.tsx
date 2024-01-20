import React, { useState } from 'react'
import { Note, ProcessList, ProcessView, ConfigJSONView, ImportStateView, useAxios, Title, useNavigation, TabNav } from '@tasenor/common-ui'
import { Trans, useTranslation } from 'react-i18next'
import { getNetConf, haveCatalog, haveStore, ID, ImportRule } from '@tasenor/common'
import Config from '../Configuration'
import { ImportResultView } from '../Components/ImportResultView'
import { ImportSuccessView } from '../Components/ImportSuccessView'
import { useTheme, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material'
import { ArrowBackOutlined } from '@mui/icons-material'

// TODO: Split to files and add brief comments.
export interface ImportProcessProps {
  importerId: ID
}

export const ImportProcess = (props: ImportProcessProps): JSX.Element => {
  const store = haveStore()
  const nav = useNavigation()
  const { db, side, attrs } = nav
  const { processId, step } = attrs
  const importerId = side ? parseInt(side) : null

  const apiUrl = `${Config.UI_API_URL}/db/${db}/import/${importerId}`
  const setup = store.rispSetup(`${apiUrl}/process/${processId}`)
  const token = getNetConf(Config.UI_API_URL, 'token') as string
  const showList = !processId
  const showViewer = !showList

  const onActionSuccess = (result, trigger, _props) => {
    if (trigger === 'onClick' || trigger === 'onContinue' || trigger === 'onCreateRule') {
      if (result.status === 'SUCCEEDED') {
        store.fetchBalances().then(() => store.fetchDocuments()).then(() => nav.go({ processId: result.processId, step: result.step }))
      } else {
        if (result.processId) {
          nav.go({ processId: result.processId, step: result.step })
        }
      }
    }
  }

  const onRetry = async () => {
    const url = `/db/${db}/import/${importerId}/process/${processId}`
    const result = await store.request(url, 'POST', { continueOption: 'retry' })
    onActionSuccess(result, 'onContinue', {})
  }

  // TODO: Passing all these views is legacy from old separate library. Should be removed and used directly everywhere.
  return (
    <div>
      {showList &&
        <ProcessList
          api={apiUrl}
          token={token}
          onClick={processId => nav.go({ processId: `${processId}` })}
        />
      }
      {showViewer &&
        <ProcessView
          api={`${apiUrl}/process`}
          token={token}
          setup={setup}
          id={parseInt(processId)}
          step={step ? parseInt(step) : undefined}
          stateView={ImportStateView}
          onBack={() => nav.go({ processId: null, step: null })}
          onChangeStep={(step) => nav.go({ processId: `${processId}`, step: `${step}` })}
          onRetry={onRetry}
          resultView={ImportResultView}
          successView={ImportSuccessView}
          onActionSuccess={(result, trigger, props) => onActionSuccess(result, trigger, props)}
        />
      }
    </div>
  )
}

export interface ViewImportRuleProps {
  importerId: ID
  ruleId: ID
  rule: ImportRule
}

export const ViewImportRule = (props: ViewImportRuleProps): JSX.Element => {
  const nav = useNavigation()
  const theme = useTheme()

  const { rule, ruleId } = props
  if (!rule) {
    return <></>
  }
  return (
    <TableContainer>
      <Table className="RuleTable" size="small">
        <TableHead>
          <TableRow style={{ backgroundColor: theme.palette.secondary.main }}>
            <TableCell variant="head" style={{ color: theme.palette.secondary.contrastText }} >
              <IconButton onClick={() => nav.go({ ruleId: null })}>
                <ArrowBackOutlined style={{ color: theme.palette.secondary.contrastText }}/>
              </IconButton>
            </TableCell>
            <TableCell variant="head" align="left" style={{ color: theme.palette.secondary.contrastText }}>
              # {ruleId} {rule.name}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>{JSON.stringify(rule)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export interface ImportRulesProps {
  importerId: ID
}

export const ImportRules = (props: ImportRulesProps): JSX.Element => {

  const nav = useNavigation()
  const { db, side, attrs } = nav
  const importerId = side ? parseInt(side) : null
  const [rules, setRules] = useState<ImportRule[]>([])
  const ruleId = attrs.ruleId ? parseInt(attrs.ruleId) : null
  const showList = !ruleId
  const showViewer = !showList

  const url = `${Config.UI_API_URL}/db/${db}/importer/${importerId}`
  const token = getNetConf(Config.UI_API_URL, 'token') as string

  useAxios({
    url,
    token,
    receiver: (resp: { config: { rules: ImportRule[] }}) => setRules(resp.config.rules as ImportRule[])
  })

  return (
    <div>
      { showList &&
        <TableContainer>
          <Table className="RuleTable" size="small">
            <TableHead>
              <TableRow>
                <TableCell variant="head" align="left" sx={{ width: 0.03 }}><Trans>#</Trans></TableCell>
                <TableCell variant="head" align="left"><Trans>Rule Name</Trans></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {
                rules.map((rule, idx) => (
                  <TableRow key={idx} onClick={() => nav.go({ ruleId: `${idx + 1}` }) }>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{rule.name}</TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>
      }
      {
        showViewer &&
          <div>
            <ViewImportRule importerId={props.importerId} ruleId={ruleId} rule={rules[ruleId - 1]}/>
          </div>
      }
    </div>
  )
}

export interface ImportTabsProps {
  importerId: ID
}

export const ImportTabs = (props: ImportTabsProps): JSX.Element => {
  const { t } = useTranslation()
  return (
    <TabNav menu="tab" labels={{ processes: t('Processes'), rules: t('Rules') }}>
      <ImportProcess importerId={props.importerId}/>
      <ImportRules importerId={props.importerId}/>
    </TabNav>
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ImportProps {
}

export const ImportPage = (props: ImportProps): JSX.Element => {
  const catalog = haveCatalog()

  const { side } = useNavigation()

  const importerId = side ? parseInt(side) : null
  const canImport = Object.keys(catalog.getImportOptions()).length > 0

  return (
    <div>
      <Title className="ImportsPage"><Trans>Imports</Trans></Title>
      {
        !canImport && (
          <Note><Trans>There are no import plugins available.</Trans></Note>
        )
      }
      {
        canImport && !importerId && (
          <div>TODO: Implement arbitrary file uploader that looks for correct importer automatically</div>
        )
      }
      {
        importerId && <ImportTabs importerId={importerId}/>
      }
    </div>
  )
}

export default ImportPage
