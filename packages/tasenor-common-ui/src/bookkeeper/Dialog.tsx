import React, { useEffect } from 'react'
import { Button, Dialog as MuiDialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { haveCursor } from '@tasenor/common'
import { Trans } from 'react-i18next'

export type DialogProps = {
  children: React.ReactNode,
  className?: string,
  fullScreen?: boolean,
  isValid?: () => boolean,
  isVisible: boolean,
  noActions?: boolean,
  okOnly?: boolean,
  onClose: () => void,
  onConfirm?: () => void,
  title: React.ReactNode,
  wider?: boolean,
}

/**
 * A dialog.
 */
export const Dialog = (props: DialogProps): JSX.Element => {

  const cursor = haveCursor()

  const { isVisible, okOnly, fullScreen, isValid, title, onClose, onConfirm, children, wider, noActions } = props
  const className = props.className || 'Dialog'

  const keyEscape = () => {
    if (!isVisible) {
      return
    }
    onClose()
    cursor.removeModal(className)
    return { preventDefault: true }
  }

  const keyEnter = () => {
    if (!isVisible) {
      return
    }
    if (isValid && !isValid()) {
      return
    }
    onConfirm && onConfirm()
    onClose()
    cursor.removeModal(className)
    return { preventDefault: true }
  }

  useEffect(() => {
    if (isVisible) {
      cursor.addModal(className, {
        keyEscape: () => keyEscape(),
        keyEnter: () => keyEnter()
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible])

  const muiProps: Record<string, unknown> = {
    className,
    fullWidth: wider || fullScreen,
    maxWidth: undefined
  }
  const paperProps: Record<string, unknown> = {}

  if (wider) {
    muiProps.maxWidth = 'sm'
  }
  if (fullScreen) {
    muiProps.maxWidth = 'xl'
    paperProps.sx = { height: '90vh' }
  }

  return (
    <MuiDialog {...muiProps}
      PaperProps={paperProps}
      open={isVisible}
      onClose={() => { cursor.removeModal(className); onClose() }}
    >
      <DialogTitle>
        {title}
      </DialogTitle>
      <DialogContent dividers data-cy={`dialog-${typeof title === 'string' ? title : title.props.children}`}>
        {children}
      </DialogContent>
      {
        noActions
          ? ''
          : <DialogActions>
        {!okOnly &&
          <Button
            id="Cancel"
            data-cy="button-Cancel"
            variant="outlined"
            onClick={() => keyEscape()}
          >
            <Trans>Cancel</Trans>
          </Button>}
        {!okOnly &&
          <Button
            id="OK"
            data-cy="button-OK"
            variant="outlined"
            onClick={() => keyEnter()}
            disabled={isValid && !isValid()}
            color="primary"
          >
            <Trans>Confirm</Trans>
          </Button>}

        {okOnly && <Button id="OK" variant="outlined" color="primary" onClick={() => keyEscape()}><Trans>Close</Trans></Button>}
      </DialogActions>
      }
    </MuiDialog>
  )
}
