import React, { useEffect, useState } from 'react'
import { observer } from 'mobx-react'
import { Trans, useTranslation } from 'react-i18next'
import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Currency, haveSettings } from '@tasenor/common'
import { Dialog, Money } from '@tasenor/common-ui'
import Store from '../Stores/Store'
import withStore from '../Hooks/withStore'

/**
 * A proposed entry. The amount is in cents.
 */
export type DraftEntry = {
  account_id: number
  debit: boolean
  amount: number
  description?: string
}

/**
 * A proposed document waiting for a person to confirm it, e.g. one made by an AI assistant
 * through the MCP server. Drafts are not part of the books until confirmed.
 */
export type Draft = {
  id: number
  period_id: number
  date: string
  description: string
  entries: DraftEntry[]
  data: { source?: string, note?: string }
  created_by: string
  created: string
}

export type DraftsProps = {
  store: Store
  db: string
  periodId: number
}

/**
 * List of drafts of the period, each with Confirm and Reject. Renders nothing when there are none.
 */
export const Drafts = withStore(observer((props: DraftsProps): JSX.Element => {
  const { store, db, periodId } = props
  const { t } = useTranslation()
  const settings = haveSettings()
  const currency = settings.get('currency') as Currency
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [toReject, setToReject] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    if (!db || !periodId || !store.isLoggedIn()) {
      setDrafts([])
      return
    }
    const list = await store.request(`/db/${db}/draft?period=${periodId}`, 'GET', null, null, true)
    setDrafts(Array.isArray(list) ? list : [])
  }

  useEffect(() => {
    load()
  }, [db, periodId])

  const confirm = async (draft: Draft) => {
    setBusy(true)
    const doc = await store.request(`/db/${db}/draft/${draft.id}/confirm`, 'POST')
    if (doc) {
      store.addMessage(t('Draft booked as transaction #{{number}}.', { number: doc.number }))
      store.invalidateReport()
      await store.fetchBalances(db, periodId)
      await store.fetchDocuments(db, periodId)
    }
    await load()
    setBusy(false)
  }

  const reject = async (draft: Draft) => {
    setToReject(null)
    setBusy(true)
    if (await store.request(`/db/${db}/draft/${draft.id}`, 'DELETE')) {
      store.addMessage(t('Draft rejected.'))
    }
    await load()
    setBusy(false)
  }

  if (!drafts.length) {
    return <></>
  }

  const accountName = (id: number): string => {
    const account = store.database && store.database.getAccount(id)
    return account ? account.toString() : `#${id}`
  }

  return (
    <Paper className="Drafts" elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">
        <Trans>Drafts waiting for confirmation</Trans> ({drafts.length})
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        <Trans>Drafts are proposed transactions. They are not in the books until confirmed.</Trans>
      </Typography>
      {drafts.map(draft => {
        const debit = draft.entries.filter(e => e.debit).reduce((sum, e) => sum + e.amount, 0)
        const credit = draft.entries.filter(e => !e.debit).reduce((sum, e) => sum + e.amount, 0)
        return (
          <Box key={draft.id} className={`Draft Draft${draft.id}`} sx={{ mt: 2 }}>
            <Typography variant="subtitle1">
              <b>{`${draft.date}`.substring(0, 10)}</b> {draft.description}
            </Typography>
            <Typography variant="caption" component="div">
              <Trans>Proposed by</Trans> {draft.data?.source ? `${draft.data.source} / ` : ''}{draft.created_by}, {`${draft.created}`.substring(0, 16).replace('T', ' ')}
            </Typography>
            {draft.data?.note && <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{draft.data.note}</Typography>}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><Trans>Account</Trans></TableCell>
                  <TableCell><Trans>Description</Trans></TableCell>
                  <TableCell align="right"><Trans>Debit</Trans></TableCell>
                  <TableCell align="right"><Trans>Credit</Trans></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {draft.entries.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{accountName(entry.account_id)}</TableCell>
                    <TableCell>{entry.description || draft.description}</TableCell>
                    <TableCell align="right">{entry.debit && <Money currency={currency} cents={entry.amount}/>}</TableCell>
                    <TableCell align="right">{!entry.debit && <Money currency={currency} cents={entry.amount}/>}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2}><b><Trans>Total</Trans></b></TableCell>
                  <TableCell align="right"><b><Money currency={currency} cents={debit}/></b></TableCell>
                  <TableCell align="right"><b><Money currency={currency} cents={credit}/></b></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Button id={`ConfirmDraft${draft.id}`} variant="contained" disabled={busy} onClick={() => confirm(draft)}><Trans>Confirm</Trans></Button>
              <Button id={`RejectDraft${draft.id}`} variant="outlined" color="error" disabled={busy} onClick={() => setToReject(draft)}><Trans>Reject</Trans></Button>
            </Box>
          </Box>
        )
      })}
      {toReject && (
        <Dialog
          className="RejectDraft"
          title={<Trans>Reject this draft?</Trans>}
          isVisible={!!toReject}
          onClose={() => setToReject(null)}
          onConfirm={() => reject(toReject)}>
          <b>{`${toReject.date}`.substring(0, 10)}</b> {toReject.description}
        </Dialog>
      )}
    </Paper>
  )
}))

export default Drafts
