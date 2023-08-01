import React, { useState } from 'react'
import { observer } from 'mobx-react'
import { Dialog } from '@tasenor/common-ui'
import { Box } from '@mui/material'

const PageDialog = (): JSX.Element => {
  const [visible, setVisible] = useState<boolean>(true)
  return <Box>
    <h1>Sample Page for Modal Dialog</h1>
    <Dialog isVisible={visible} onClose={() => setVisible(false)} okOnly title="Hello Dialog">Hello</Dialog>
  </Box>
}

export default observer(PageDialog)
