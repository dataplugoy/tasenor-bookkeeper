import React from 'react'
import { Box } from '@mui/material'
import { RuleResultView } from '@dataplug/tasenor-common'
import { VisualRuleLine } from './VisualRuleLine'

export interface VisualResultRuleProps {
  view: RuleResultView
}

export const VisualResultRule = (props: VisualResultRuleProps): JSX.Element => {
  const { view } = props

  return (
    <Box>
      <VisualRuleLine field="reason" op={view.reason.op} value={view.reason.value}/>
      <VisualRuleLine field="type" op={view.type.op} value={view.type.value}/>
      <VisualRuleLine field="asset" op={view.asset.op} value={view.asset.value}/>
      <VisualRuleLine field="amount" op={view.amount.op} value={view.amount.value}/>
      {
        view.tags && <VisualRuleLine field="tags" op={view.tags.op} value={view.tags.value}/>
      }
      {
        view.data && Object.keys(view.data).length > 0 &&
          Object.keys(view.data).map(key =>
            view.data && key in view.data &&
            <VisualRuleLine key={key} field={`data.${key}`} op={view.data[key].op} value={view.data[key].value}/>)
      }
    </Box>
  )
}
