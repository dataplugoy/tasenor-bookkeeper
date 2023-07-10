import { MAX_UPLOAD_SIZE } from '@dataplug/tasenor-common'
import React from 'react'
import ReactDOM from 'react-dom/client'

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <div>
    {MAX_UPLOAD_SIZE}
  </div>
)
