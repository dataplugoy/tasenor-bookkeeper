import React, { useState } from 'react'
import { TextFileLine, RuleFilterView, TransactionImportOptions } from '@tasenor/common'
import { Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material'
import { Trans, useTranslation } from 'react-i18next'
import { observer } from 'mobx-react'
import { IconButton as TasenorIconButton } from '../IconButton'
import { RuleColumnEdit } from './RuleColumnEdit'

interface RuleLineEditProps {
  line: TextFileLine
  filters: RuleFilterView[]
  options: TransactionImportOptions
  onSetFilter: (filters: RuleFilterView[]) => void
}

/**
 * Editor for a single text line displaying all columns to edit for sample line.
 */
export const RuleLineEdit = observer((props: RuleLineEditProps): JSX.Element => {
  const { line, options } = props
  const { columns } = line
  const { t } = useTranslation()
  const [more, setMore] = useState(false)

  const insignificantFields = new Set(options.insignificantFields || [])

  return (
    <TableContainer>
      <Table size="small">
        <TableBody>
        {
          Object.keys(columns).filter(key => !key.startsWith('_')).map(key =>
            insignificantFields.has(key) && !more
              ? <React.Fragment key={key}></React.Fragment>
              : <RuleColumnEdit
              key={key}
              name={key}
              options={options}
              value={columns[key]}
              filters={props.filters}
              onSetFilter={props.onSetFilter}
            />)
        }
        {
          insignificantFields.size > 0 &&
          <TableRow>
            <TableCell colSpan={3}>
              {more && <Trans>Show Less</Trans>}
              {more && <TasenorIconButton id="less" icon="less" title={t('Show Less')} onClick={() => setMore(false)}/>}
              {!more && <Trans>Show More</Trans>}
              {!more && <TasenorIconButton id="more" icon="more" title={t('Show More')} onClick={() => setMore(true)}/>}
            </TableCell>
          </TableRow>
        }
        </TableBody>
      </Table>
    </TableContainer>
  )
})
