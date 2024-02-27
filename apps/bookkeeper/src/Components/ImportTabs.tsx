import React from 'react'
import { TabNav } from '@tasenor/common-ui'
import { useTranslation } from 'react-i18next'
import { ID } from '@tasenor/common'
import { ImportProcess } from './ImportProcess'
import { ImportRules } from './ImportRules'

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
