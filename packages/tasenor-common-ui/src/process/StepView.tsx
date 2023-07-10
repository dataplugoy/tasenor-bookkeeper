import React from 'react'
import { DefaultStateView, DefaultStateViewProps } from './DefaultStateView'
import { DefaultResultView, DefaultResultViewProps } from './DefaultResultView'
import { ProcessStepModelData, ProcessModelDetailedData } from '@dataplug/tasenor-common'
import { SummaryView } from './SummaryView'

export type StepViewProps = {
  api: string
  token?: string
  step: ProcessStepModelData | null
  process: ProcessModelDetailedData
  stateView?: (props: DefaultStateViewProps) => JSX.Element
  resultView?: (props: DefaultResultViewProps) => JSX.Element
}

/**
 * Default viewer for a process configuration displaying names and values as is on one single line.
 * @param props
 * @returns
 */
export const StepView = (props: StepViewProps): JSX.Element => {

  const { step } = props

  if (!step) {
    return <></>
  }

  const StateView = props.stateView || DefaultStateView
  const ResultView = props.resultView || DefaultResultView

  return (
    <div>
      <SummaryView step={step} process={props.process} />
      {step.state && <StateView config={props.process.config} state={step.state} resultView={ResultView}/>}
    </div>
  )
}
