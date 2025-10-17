import React, { useState } from 'react'
import { SegmentId, TextFileLine, AccountNumber, Expression, filterView2name, ImportRule, RuleResultView, Store, Tag, TagModel, TransactionImportOptions, Value, ProcessConfig, filterView2rule, filterView2results, isValues, isValue, RuleView } from '@tasenor/common'
import { Box, Button, Divider, Grid, Stack, TextField, Typography, styled, Paper, Link, useTheme } from '@mui/material'
import { TagGroup } from '../TagGroups'
import { AccountSelector } from '../AccountSelector'
import { Trans, useTranslation } from 'react-i18next'
import { observer } from 'mobx-react'
import { RuleLineEdit } from './RuleLineEdit'
import { VisualRule } from './VisualRule'
import { RISPProvider } from '../..'

/**
 * Major operating mode for the editor: either build once off rule or complete new permanent rule.
 */
export type RuleEditorMode = null | 'once-off' | 'new-rule'

/**
 * Alternative continuation options from rule editor.
 */
export type RuleEditorContinueOption = 'retry' | 'apply-once' | 'skip-one' | 'ignore-rest-unrecognized' | 'suspense-unrecognized'

/**
 * The collection of values produced and used by the rule editor.
 */
export type RuleEditorValues = {
  mode: RuleEditorMode
  account: AccountNumber
  tags: string[]
  text: string
  segment: SegmentId
  transfers: Value[]
  rule?: Value
  continueOption?: RuleEditorContinueOption
}

/**
 * Input attributes needed by the rule editor.
 */
export type RuleEditorProps = {
  store: Store
  config: ProcessConfig
  lines: TextFileLine[]
  cashAccount: AccountNumber | null
  values: Partial<RuleEditorValues>
  options: TransactionImportOptions
  onChange: (update: RuleEditorValues) => void
  onContinue: (option: RuleEditorContinueOption) => void
  onCreateRule: () => void
}

/**
 * Spacing and styling for a box containing rule editor section.
 */
const Item = (props): JSX.Element => {
  const theme = useTheme()
  return <Paper sx={{
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'left',
    color: theme.palette.text.secondary
  }}>
    {props.children}
  </Paper>
}

/**
 * Actual editor for rules.
 */
export const RuleEditor = observer((props: RuleEditorProps): JSX.Element => {

  const { store, lines, cashAccount, values, onChange, onContinue, onCreateRule, options } = props
  const allTags: Record<Tag, TagModel> = store.db ? store.dbsByName[store.db].tagsByTag : {}

  const [tags, setTags] = useState<string[]>(values && values.tags ? values.tags : [])
  const [account, setAccount] = useState(values && values.account ? values.account : '')
  const [text, setText] = useState(values && values.text
    ? values.text
    : (lines && lines.length ? lines[0].columns._textField : ''))
  const [rule, setRule] = useState<ImportRule>({
    name: 'New Rule',
    filter: 'null' as Expression,
    view: {
      filter: [],
      result: []
    },
    result: [],
    examples: lines
  })
  const [mode, setMode] = useState<RuleEditorMode>(null)
  const [autonaming, setAutonaming] = useState(true)

  const { t } = useTranslation()

  if (!lines || lines.length < 1) return <></>

  // Helper to construct transfers from the known facts, if possible.
  const transfers = ({ text, account, tags }): Value[] => {
    const _totalAmountField = parseFloat(lines[0].columns._totalAmountField)

    const transfers: Value[] = []
    if (cashAccount) {
      transfers.push({
        reason: _totalAmountField < 0 ? 'expense' : 'income',
        type: 'account',
        asset: cashAccount,
        amount: _totalAmountField,
        data: {
          text
        }
      } as unknown as Value)
    }
    if (account) {
      transfers.push({
        reason: _totalAmountField < 0 ? 'expense' : 'income',
        type: 'account',
        asset: account,
        amount: -_totalAmountField,
      } as unknown as Value)
    }
    if (tags.length && isValue(tags)) {
      if (isValues(transfers[0])) transfers[0].tags = tags
      if (isValues(transfers[1])) transfers[1].tags = tags
    }
    return transfers
  }

  // Helper to construct result views from the known facts, if possible.
  const resultViews = ({ account, tags }): RuleResultView[] => {
    const _totalAmountField = parseFloat(lines[0].columns._totalAmountField)

    const results: RuleResultView[] = []

    if (!options.totalAmountField) {
      throw new Error(`Cannot use rule editor since options has no 'totalAmountField' in ${JSON.stringify(options)}`)
    } else if (!options.textField) {
      throw new Error(`Cannot use rule editor since options has no 'textField' in ${JSON.stringify(options)}`)
    } else {
      if (cashAccount && options.totalAmountField) {
        results.push(
          {
            reason: { op: 'setLiteral', value: _totalAmountField < 0 ? 'expense' : 'income' },
            type: { op: 'setLiteral', value: 'account' },
            asset: { op: 'setLiteral', value: cashAccount },
            amount: { op: 'copyField', value: options.totalAmountField },
            data: {
              text: { op: 'copyField', value: options.textField }
            }
          }
        )
      }
    }
    if (account) {
      results.push(
        {
          reason: { op: 'setLiteral', value: _totalAmountField < 0 ? 'expense' : 'income' },
          type: { op: 'setLiteral', value: 'account' },
          asset: { op: 'setLiteral', value: account },
          amount: { op: 'copyInverseField', value: options.totalAmountField },
          data: {
            text: { op: 'copyField', value: options.textField }
          }
        }
      )
    }
    if (tags.length) {
      if (results[0]) results[0].tags = { op: 'setLiteral', value: JSON.stringify(tags) }
      if (results[1]) results[1].tags = { op: 'setLiteral', value: JSON.stringify(tags) }
    }

    return results
  }

  // This is actual output value of the editor as a whole.
  const editorOutput: RuleEditorValues = {
    mode,
    account: account as AccountNumber,
    tags,
    text,
    segment: lines[0].segmentId as SegmentId,
    transfers: transfers({ text, account, tags }),
    rule
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Trans>We have found lines in the imported file that does not match anything we know already. Please help to determine what to do with this.</Trans>
        </Grid>

        <Grid item xs={12}>
          <Item>
            {
              lines.map((line, idx) => <Typography title={t('Line number #{number}').replace('{number}', `${line.line}`)} key={idx} sx={{ fontFamily: 'monospace' }}>{line.text.replace(/\t/g, ' ⎵ ')}</Typography>)
            }
          </Item>
        </Grid>

        <Grid item xs={7}>
          <Item>
            <Typography variant="h5"><Trans>Quick Once-Off Selection</Trans></Typography>
            <AccountSelector
              label={'Select Account'}
              value={account ? store.database.getAccountByNumber(account) : null}
              accounts={store.accounts}
              onChange={acc => {
                if (!acc) return
                setAccount(acc.number)
                setMode('once-off')
                const resView = resultViews({ account, tags })
                const result = filterView2results(resView)
                const ruleView: RuleView = { ...rule.view || { filter: [] }, result: resView }
                const newRule: ImportRule = { ...rule, result, view: ruleView }
                setRule(newRule)
                onChange({ ...editorOutput, rule: newRule as unknown as Value, transfers: transfers({ text, tags, account: acc.number }), account: acc.number })
              }
              }
            />
            <TextField
              fullWidth
              autoComplete="off"
              label={'Describe this transaction'}
              value={text}
              onFocus={() => RISPProvider.onFocus()}
              onBlur={() => RISPProvider.onBlur()}
                  onChange={(e) => {
                    setText(e.target.value)
                    setMode('once-off')
                    onChange({ ...editorOutput, transfers: transfers({ text: e.target.value, tags, account }), text: e.target.value })
                  }
              }
              sx={{ pb: 1, pt: 1 }}
            />
            <TagGroup
              tags={allTags}
              single={false}
              options={Object.keys(allTags) as Tag[]}
              onChange={(selected) => {
                setTags(selected)
                setMode('once-off')
                const resView = resultViews({ account, tags })
                const result = filterView2results(resView)
                const ruleView: RuleView = { ...rule.view || { filter: [] }, result: resView }
                const newRule: ImportRule = { ...rule, result, view: ruleView }
                setRule(newRule)
                onChange({ ...editorOutput, rule: newRule as unknown as Value, transfers: transfers({ text, tags: selected, account }), tags: selected })
              }
              }
              selected={tags as Tag[]}
            />

            <Button sx={{ mt: 1 }} variant="outlined" disabled={ !text || !account } onClick={() => onContinue('apply-once')}>Continue</Button>
            <Box>
            <Typography variant="h5" color="secondary"><Trans>Alternatively</Trans></Typography>

            <Link
              onClick={() => {
                onChange(editorOutput)
                onContinue('skip-one')
              }}
              sx={{ cursor: 'pointer' }}
            >
              <Typography color="secondary"><Trans>Skip this transaction and continue</Trans></Typography>
            </Link>

            <Link
              onClick={() => {
                onChange(editorOutput)
                onContinue('ignore-rest-unrecognized')
              }}
              sx={{ cursor: 'pointer' }}
            >
              <Typography color="secondary"><Trans>Continue and ignore all further unrecognized lines</Trans></Typography>
            </Link>

            <Link
              onClick={() => {
                onChange(editorOutput)
                onContinue('suspense-unrecognized')
              }}
              sx={{ cursor: 'pointer' }}
            >
              <Typography color="secondary"><Trans>Continue and create transactions on suspense account</Trans></Typography>
            </Link>

            </Box>
          </Item>
        </Grid>

        <Grid item xs={5}>
          <Item>
            <Typography variant="h5"><Trans>Construct a Permanent Rule</Trans></Typography>
            <TextField
              fullWidth
              autoComplete="off"
              label={'Name of the rule'}
              value={rule.name}
              onFocus={() => RISPProvider.onFocus()}
              onBlur={() => RISPProvider.onBlur()}
              onChange={(e) => {
                setAutonaming(e.target.value.length === 0)
                setMode('new-rule')
                const newRule: ImportRule = { ...rule, name: e.target.value }
                setRule(newRule)
                onChange({ ...editorOutput, rule: newRule as unknown as Value })
              }
              }
              sx={{ mt: 2 }}
            />
            {
              lines.map((line, idx) => <Stack spacing={1} key={idx}>
                <RuleLineEdit
                  line={line}
                  filters={rule.view ? rule.view.filter : []}
                  options={options}
                  onSetFilter={(filters) => {
                    const filter = filterView2rule(filters)
                    const name = autonaming ? filterView2name(filters) : rule.name
                    setMode('new-rule')
                    const resView = resultViews({ account, tags })
                    const result = filterView2results(resView)
                    const newRule: ImportRule = { ...rule, name, result, filter, view: { filter: filters, result: resView } }
                    setRule(newRule)
                    onChange({ ...editorOutput, rule: newRule as unknown as Value })
                  }}
                />
                {idx < lines.length - 1 && <Divider variant="middle"/>}
              </Stack>)
            }
            <Button variant="outlined" disabled={ !(rule.view && rule.view.filter.length) } onClick={() => onCreateRule()}>Create Rule</Button>
          </Item>
        </Grid>

        <Grid item xs={7}>
          <Item>
            <Typography variant="h5"><Trans>Resulting Transfers</Trans></Typography>
            TODO: DISPLAY TRANSFERS HERE (Substitute values from sample lines)
          </Item>
        </Grid>

        <Grid item xs={5}>
          <Item>
            <Typography variant="h5"><Trans>Current Rule</Trans></Typography>
            {rule && rule.view && (
              <VisualRule
                rule={rule.view}
                onSetFilter={(filters) => {
                  const filter = filterView2rule(filters)
                  const name = autonaming ? filterView2name(filters) : rule.name
                  const ruleView: RuleView = { ...rule.view || { result: [] }, filter: filters }
                  const newRule: ImportRule = { ...rule, name, filter, view: ruleView }
                  setRule(newRule)
                  onChange({ ...editorOutput, rule: newRule as unknown as Value })
                }
                }
              />
            )}
          </Item>
        </Grid>

        <Grid item xs={7}>
          <Item>
            <Typography variant="h5"><Trans>Resulting Transactions</Trans></Typography>
            TODO: DISPLAY TRANSACTION HERE
          </Item>
        </Grid>

      </Grid>
    </Box>
  )
})
