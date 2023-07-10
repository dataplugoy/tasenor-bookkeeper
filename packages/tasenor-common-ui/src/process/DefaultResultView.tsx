import { ProcessConfig } from '@dataplug/tasenor-common'
import React from 'react'

export type DefaultResultViewProps = {
  config: ProcessConfig
  result: unknown
}

/**
 * Simple JSON display for result.
 * @param props
 * @returns
 */
export const DefaultResultView = (props: DefaultResultViewProps): JSX.Element => {

  if (props.result === null) {
    return <></>
  }

  return (
    <pre>
      {JSON.stringify(props.result, null, 2)}
    </pre>
  )
}
