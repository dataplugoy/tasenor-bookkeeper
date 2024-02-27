import React, { useState } from 'react'
import { useAxios, useNav } from '@tasenor/common-ui'
import { Trans } from 'react-i18next'
import { getNetConf, ID, ImportRule } from '@tasenor/common'
import Config from '../Configuration'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { ViewImportRule } from './ViewImportRule'

export interface ImportRulesProps {
  importerId: ID
}

export const ImportRules = (props: ImportRulesProps): JSX.Element => {

  const nav = useNav()
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
