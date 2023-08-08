import { Currency, haveStore, ProcessModelDetailedData, ProcessStatus, ProcessStepModelData, TransactionApplyResults } from '@tasenor/common'
import { Money, ProcessStatusIcon, Dialog, useNavigation } from '@tasenor/common-ui'
import { Button, Card, CardActions, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { green } from '@mui/material/colors'
import { observer } from 'mobx-react'
import React, { useState } from 'react'
import { Trans } from 'react-i18next'

export type ImportSuccessViewProps = {
  process: ProcessModelDetailedData
  step: ProcessStepModelData
}

/**
 * Simple state display showing a success mark if state is success.
 * @param props
 * @returns
 */
export const ImportSuccessView = observer((props: ImportSuccessViewProps): JSX.Element => {
  const { process, step } = props
  const store = haveStore()

  const [reverting, setReverting] = useState(false)
  const nav = useNavigation()

  if (!step || !step.state || !store.database || !step.state.output) {
    return <></>
  }

  const { created, duplicates, ignored, skipped, accounts } = step.state.output as TransactionApplyResults

  const onRollback = () => {
    setReverting(false)
    const url = `/db/${store.db}/import/${process.ownerId}/process/${process.id}/rollback`
    store.request(url, 'POST').then(() => {
      nav.go({ side: `${process.ownerId}`, step: null, processId: null })
    })
  }

  return (
    <Card>
      <CardContent>
        <ProcessStatusIcon status={'SUCCEEDED' as ProcessStatus}/>
          <Typography sx={{ color: green[900] }}>
            <Trans>Process Was Successfully Completed!</Trans>
          </Typography>
          <Trans>Created</Trans> {created}<br/>
          <Trans>Duplicates</Trans> {duplicates}<br/>
          <Trans>Ignored</Trans> {ignored}<br/>
          <Trans>Skipped</Trans> {skipped}<br/>
          {Object.keys(accounts).length > 0 &&
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell colSpan={2}><Trans>Account Changes</Trans></TableCell></TableRow>
                </TableHead>
                <TableBody>
                {
                  Object.keys(accounts).map(number => {
                    const account = store.database.getAccountByNumber(number)
                    return <TableRow key={number}>
                      <TableCell align="right"><Money signed currency={account.currency as Currency} cents={accounts[number]}/></TableCell>
                      <TableCell>{`${account.number} ${account.name}`}</TableCell>
                    </TableRow>
                  })
                }
                </TableBody>
              </Table>
            </TableContainer>
          }
        <CardActions>
          <Button onClick={() => setReverting(true)}><Trans>Revert Changes</Trans></Button>
        </CardActions>
      </CardContent>

      <Dialog
        title={<Trans>Revert All Changes</Trans>}
        isVisible={reverting}
        onConfirm={onRollback}
        onClose={() => {
          setReverting(false)
        }
      }>
        <Trans>Are you sure?</Trans>
      </Dialog>
    </Card>
  )
})
