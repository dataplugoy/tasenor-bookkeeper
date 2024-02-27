import React from 'react'
import { useNav } from '@tasenor/common-ui'
import { ID, ImportRule } from '@tasenor/common'
import { useTheme, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material'
import { ArrowBackOutlined } from '@mui/icons-material'

export interface ViewImportRuleProps {
  importerId: ID
  ruleId: ID
  rule: ImportRule
}

export const ViewImportRule = (props: ViewImportRuleProps): JSX.Element => {
  const nav = useNav()
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
