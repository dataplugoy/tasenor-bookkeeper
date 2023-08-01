import { ProcessModelDetailedData, ProcessStepModelData, ProcessStatus } from '@tasenor/common'
import { Card, CardContent, Typography } from '@mui/material'
import { green } from '@mui/material/colors'
import React from 'react'
import { Trans } from 'react-i18next'
import { ProcessStatusIcon } from '.'

export type DefaultSuccessViewProps = {
  process: ProcessModelDetailedData
  step: ProcessStepModelData
}

/**
 * Simple state display showing a success mark if state is success.
 * @param props
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DefaultSuccessView = (props: DefaultSuccessViewProps): JSX.Element => {
  return (
    <Card>
      <CardContent>
      <ProcessStatusIcon status={'SUCCEEDED' as ProcessStatus}/>
        <Typography sx={{ color: green[900] }}>
          <Trans>Process Was Successfully Completed!</Trans>
        </Typography>
      </CardContent>
    </Card>
  )
}
