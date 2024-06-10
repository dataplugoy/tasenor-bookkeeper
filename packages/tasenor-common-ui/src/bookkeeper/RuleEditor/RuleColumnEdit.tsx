import React, { useState } from 'react'
import { IconButton, TableCell, TableRow, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { RuleFilterView, TransactionImportOptions, RuleViewOp } from '@tasenor/common'
import { observer } from 'mobx-react'
import RttIcon from '@mui/icons-material/Rtt'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import clone from 'clone'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import TextFormatIcon from '@mui/icons-material/TextFormat'
import { useTranslation } from 'react-i18next'
import { RISPProvider } from '../..'

/**
 * Mode definitions for column editor.
 */
type RuleColumnEditMode = null | 'textMatch'

export interface RuleColumnEditProps {
   name: string
   value: string
   filters: RuleFilterView[]
   options: TransactionImportOptions
   onSetFilter: (filters: RuleFilterView[]) => void
}

/**
* Editor for single named column of the example line.
*/
export const RuleColumnEdit = observer((props: RuleColumnEditProps): JSX.Element => {
  const { name, value, filters, onSetFilter, options } = props

  const [mode, setMode] = useState<RuleColumnEditMode>(null)
  const [text, setText] = useState<string>(value)
  const [toggles, setToggles] = useState<string[]>([])
  const { t } = useTranslation()

  const hasBeenUsed = filters.filter(f => f.field === name).length > 0
  const isNumeric = options.numericFields.filter(f => f === name).length > 0
  const isText = !isNumeric
  const isGreaterThan = filters.filter(f => f.op === 'isGreaterThan').length > 0
  const isLessThan = filters.filter(f => f.op === 'isLessThan').length > 0

  const updateFilter = (view: RuleFilterView): void => {
    const rules = clone(filters).filter((f: RuleFilterView) => f.field !== view.field)
    rules.push(view)
    onSetFilter(rules)
  }

  let IconRow: JSX.Element = (
     <TableRow selected={hasBeenUsed}>
       <TableCell variant="head"><b>{name}</b></TableCell>
       <TableCell>{value}</TableCell>
       <TableCell align="right">
         {
           isText &&
             <IconButton
             color="primary"
             size="medium"
             title={t('Match the text in this column')}
             disabled={mode === 'textMatch'}
             onClick={() => setMode('textMatch')}
           >
             <RttIcon/>
           </IconButton>
         }
         {
           isNumeric &&
           <IconButton
             color="primary"
             size="medium"
             title={t('Require that this field is negative')}
             disabled={isLessThan}
             onClick={() => updateFilter({ op: 'isLessThan', field: name, value: 0 })}
           >
             <RemoveCircleOutlineIcon/>
           </IconButton>
         }
         {
           isNumeric &&
           <IconButton
             color="primary"
             size="medium"
             title={t('Require that this field is positive')}
             disabled={isGreaterThan}
             onClick={() => updateFilter({ op: 'isGreaterThan', field: name, value: 0 })
           }
         >
             <AddCircleOutlineIcon/>
           </IconButton>
         }
       </TableCell>
     </TableRow>
  )

  let EditRow: JSX.Element | null = null

  if (mode === 'textMatch') {
    const info = (toggles.includes('whole')
      ? t('Match if the full text in `{field}` column is the text below ({case})')
      : t('Match if the text is found from `{field}` column ({case})')
    ).replace('{field}', name).replace('{case}', toggles.includes('case') ? t('case sensitive') : t('ignore case'))

    IconRow = (
       <TableRow>
         <TableCell colSpan={2}>{info}</TableCell>
         <TableCell>
           <ToggleButtonGroup value={toggles} onChange={(_, val) => setToggles(val)}>
             <ToggleButton title={t('Case sensitive match')} value="case"><TextFieldsIcon/></ToggleButton>
             <ToggleButton title={t('Match complete field value')} value="whole"><TextFormatIcon/></ToggleButton>
           </ToggleButtonGroup>
         </TableCell>
       </TableRow>
    )

    EditRow = (
       <TableRow>
         <TableCell colSpan={3}>
           <TextField
               fullWidth
               autoFocus
               onKeyUp={(event) => {
                 if (event.key === 'Enter') {
                   setMode(null)
                   const op = `case${toggles.includes('case') ? 'Insensitive' : 'Sensitive'}${toggles.includes('whole') ? 'Full' : ''}Match` as RuleViewOp
                   updateFilter({ op, field: name, text })
                   RISPProvider.onBlur()
                 }
                 if (event.key === 'Escape') {
                  RISPProvider.onBlur()
                  setMode(null)
                 }
               }}
               label={t('The text to match') + ''}
               value={text}
               onFocus={() => RISPProvider.onFocus()}
               onBlur={() => RISPProvider.onBlur()}
               onChange={(e) => setText(e.target.value)}
             />
         </TableCell>
       </TableRow>
    )
  }

  return EditRow ? <>{IconRow}{EditRow}</> : IconRow
})
