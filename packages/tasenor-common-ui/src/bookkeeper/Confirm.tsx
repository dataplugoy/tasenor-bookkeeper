import React from 'react'
import { Dialog } from './Dialog'

export type ConfirmProps = {
  children: React.ReactNode
  title: string
  isVisible: boolean
  onClose: () => void
}

/**
 * A simple confirm dialog.
 */
export const Confirm = (props: ConfirmProps): JSX.Element => {
  const { children, title, isVisible, onClose } = props

  return <Dialog
    title={title}
    isVisible={isVisible}
    children={children}
    onClose={onClose}
    okOnly
  />
}
