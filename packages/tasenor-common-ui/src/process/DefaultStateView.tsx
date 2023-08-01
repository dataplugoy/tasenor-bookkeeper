import { ProcessConfig } from '@tasenor/common'
import React from 'react'
import { ConfigViewProps } from './ConfigView'
import { DefaultResultViewProps } from './DefaultResultView'

export type DefaultStateViewProps = {
  state: Record<string, unknown> | null
  config: ProcessConfig
  resultView: (props: DefaultResultViewProps) => JSX.Element
  configView?: (props: ConfigViewProps) => JSX.Element
}

/**
 * Simple JSON display for state.
 * @param props
 * @returns
 */
export const DefaultStateView = (props: DefaultStateViewProps): JSX.Element => {

  if (props.state === null) {
    return <></>
  }

  const ResultView = props.resultView
  return <>
    <pre>
      {JSON.stringify(props.state, null, 2)}
    </pre>
    { props.state.result && <ResultView config={props.config} result={props.state.result}/>}
  </>
}
