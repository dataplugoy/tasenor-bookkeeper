import React from 'react'
import { ImportFile } from './ImportFile'
import { DefaultResultViewProps } from './DefaultResultView'
import { ProcessConfig, isImportState, ImportState, SegmentId } from '@tasenor/common'

export type ImportStateViewProps = {
  state: Record<string, unknown>
  config: ProcessConfig
  resultView: (props: DefaultResultViewProps) => JSX.Element
}

/**
 * Simple JSON display for state.
 * @param props
 * @returns
 */
export const ImportStateView = (props: ImportStateViewProps): JSX.Element => {

  if (props.state === null) {
    return <></>
  }

  if (!isImportState(props.state)) {
    return <></>
  }

  const state: ImportState = props.state

  const result = state.result ? state.result as Record<SegmentId, unknown> : undefined
  return (
    <div>
      {Object.entries(state.files).map(([name, file]) => (
        <ImportFile
          key={name}
          name={name}
          config={props.config}
          resultView={props.resultView}
          result={result}
          lines={file.lines}
        />
      ))}
    </div>
  )
}
