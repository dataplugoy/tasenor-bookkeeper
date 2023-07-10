import { Stepper, Step, StepLabel } from '@mui/material'
import React from 'react'

export type StepListProps = {
  onChangeStep: (step: number) => void
  operations: string[]
  currentStep: number
}

/**
 * A line showing steps.
 * @param props
 * @returns
 */
export const StepList = (props: StepListProps): JSX.Element => {

  return (
    <Stepper activeStep={props.currentStep || 0}>
    {props.operations.map((label, idx) => (
      <Step key={idx}>
        <StepLabel onClick={() => props.onChangeStep(idx)}>{label}</StepLabel>
      </Step>
    ))}
    </Stepper>
  )
}
