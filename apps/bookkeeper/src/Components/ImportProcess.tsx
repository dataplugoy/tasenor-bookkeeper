import React from 'react'
import { ProcessList, ProcessView, ImportStateView, useNav } from '@tasenor/common-ui'
import { getNetConf, haveStore, ID } from '@tasenor/common'
import Config from '../Configuration'
import { ImportResultView } from '../Components/ImportResultView'
import { ImportSuccessView } from '../Components/ImportSuccessView'

export interface ImportProcessProps {
  importerId: ID
}

/**
 * Viewer for import list or single import.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ImportProcess = (props: ImportProcessProps): JSX.Element => {
  const store = haveStore()
  const nav = useNav()
  const { db, side, attrs } = nav
  const { processId, step } = attrs
  const importerId = side ? parseInt(side) : null

  const apiUrl = `${Config.UI_API_URL}/db/${db}/import/${importerId}`
  const setup = store.rispSetup(`${apiUrl}/process/${processId}`)
  const token = getNetConf(Config.UI_API_URL, 'token') as string
  const showList = !processId
  const showViewer = !showList

  const onActionSuccess = (result, trigger: string) => {
    if (trigger === 'onClick' || trigger === 'onContinue' || trigger === 'onCreateRule') {
      if (result.status === 'SUCCEEDED') {
        store.fetchBalances().then(() => store.fetchDocuments()).then(() => nav.go({ processId: result.processId, step: result.step }))
      } else {
        if (result.processId) {
          nav.go({ processId: result.processId, step: result.step })
        }
      }
    }
  }

  const onRetry = async () => {
    const url = `/db/${db}/import/${importerId}/process/${processId}`
    const result = await store.request(url, 'POST', { continueOption: 'retry' })
    onActionSuccess(result, 'onContinue')
  }

  // TODO: Passing all these views is legacy from old separate library. Should be removed and used directly everywhere.
  return (
    <div>
      {showList &&
        <ProcessList
          api={apiUrl}
          token={token}
          onClick={processId => nav.go({ processId: `${processId}` })}
        />
      }
      {showViewer &&
        <ProcessView
          api={`${apiUrl}/process`}
          token={token}
          setup={setup}
          id={parseInt(processId)}
          step={step ? parseInt(step) : undefined}
          stateView={ImportStateView}
          onBack={() => nav.go({ processId: null, step: null })}
          onChangeStep={(step) => nav.go({ processId: `${processId}`, step: `${step}` })}
          onRetry={onRetry}
          resultView={ImportResultView}
          successView={ImportSuccessView}
          onActionSuccess={(result, trigger) => onActionSuccess(result, trigger)}
        />
      }
    </div>
  )
}
