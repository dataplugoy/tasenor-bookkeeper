import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import React, { useState } from 'react'
import { Trans } from 'react-i18next'

export type JsonEditorProps = {
  visible: boolean,
  title: string,
  json: Record<string, unknown>,
  onCancel: () => void
  onSave: (any) => void
}

/**
 * JSON editor for any JSON.
 * @param props
 * @returns
 */
export const JsonEditor = (props: JsonEditorProps): JSX.Element => {

  const { visible, title, json } = props
  const [invalid, setInvalid] = useState(false)
  const [content, setContent] = useState(JSON.stringify(json, null, 2))

  if (!props.visible) {
    return <></>
  }

  const onSave = async () => {
    try {
      setInvalid(false)
      const data = JSON.parse(content)
      props.onSave(data)
    } catch (err) {
      setInvalid(true)
    }
  }

  const onCancel = async () => {
    props.onCancel()
  }

  return <>
    <Dialog fullWidth maxWidth="xl" open={visible} PaperProps={{ sx: { height: '90vh' } }}>
      <DialogTitle><Trans>{title}</Trans></DialogTitle>
      <DialogContent>
        {invalid && <Typography color="error"><Trans>JSON value is not valid</Trans></Typography>}
        <Box style={{ height: '70vh' }}>
          <TextField
            multiline
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

        </Box>
      </DialogContent>
      <DialogActions>
        <Button id="Cancel" variant="outlined" onClick={() => onCancel()}><Trans>Cancel</Trans></Button>
        <Button id="Save" variant="outlined" onClick={() => onSave()} color="primary"><Trans>Save</Trans></Button>
      </DialogActions>
    </Dialog>
  </>
}
