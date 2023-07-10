import React from 'react'
import { Stack, Typography } from '@mui/material'
import { RuleFilterView, RuleResultView } from '@dataplug/tasenor-common'
import { Trans } from 'react-i18next'
import { VisualRuleLine } from './VisualRuleLine'
import { VisualResultRule } from './VisualResultRule'

export interface VisualRuleProps {
  rule: {
    filter: RuleFilterView[]
    result: RuleResultView[]
  },
  onSetFilter: (filters: RuleFilterView[]) => void
}

export const VisualRule = (props: VisualRuleProps): JSX.Element => {
  const { rule, onSetFilter } = props

  const onDelete = (idx: number) => {
    const remaining = rule.filter.filter((f, i) => i !== idx)
    onSetFilter(remaining)
  }

  return (
    <>
      {
        rule.filter.length > 0 && <>
          <Typography variant="h5">Filter</Typography>
          {
            rule.filter.map((filter, idx) =>
              <VisualRuleLine key={idx} onDelete={() => onDelete(idx)} op={filter.op} field={filter.field} text={filter.text} value={filter.value}/>)
          }
        </>
      }
      {
        rule.result.length > 0 && <>
          <Typography variant="h5"><Trans>Result</Trans></Typography>
          <Stack spacing={2}>
          {
            rule.result.map((result, idx) => <VisualResultRule key={idx} view={result}/>)
          }
          </Stack>
        </>
      }
    </>
  )
}
