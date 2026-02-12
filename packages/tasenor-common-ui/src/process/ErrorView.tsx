import { Button, Card, CardContent, CardHeader, Typography, useTheme } from '@mui/material'
import React from 'react'
import { Trans } from 'react-i18next'

export type ErrorViewProps = {
  error: string
  onRetry: () => void
}

/**
 * Simple pre-formatted error display.
 * @param props
 * @returns
 */
export const ErrorView = (props: ErrorViewProps): JSX.Element => {
  const { palette } = useTheme()
  return (
    <Card sx={{ backgroundColor: 'action.hover' }}>
      <CardHeader style={{ color: palette.error.main }} title={<Trans>Error</Trans>}/>
      <CardContent sx={{ fontFamily: 'monospace' }}>
        <Typography>
          {props.error.split('\n').map((line, idx) => <React.Fragment key={idx}>{line}<br/></React.Fragment>)}
          <Button variant="outlined" onClick={() => props.onRetry()}><Trans>Retry</Trans></Button>
        </Typography>
      </CardContent>
    </Card>
  )
}
