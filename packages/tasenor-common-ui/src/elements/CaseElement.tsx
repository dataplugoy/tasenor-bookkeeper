import { RenderingProps, isCaseElement } from '@tasenor/common'
import React from 'react'
import { Renderer, RenderingEngine } from '../risp'

export const CaseRenderer: Renderer = (props: RenderingProps) => {
  const { element, values } = props
  if (!isCaseElement(element)) {
    throw new Error(`Wrong renderer ${JSON.stringify(element)}.`)
  }
  const { cases, condition } = element
  const noValue = values[condition] === undefined || values[condition] === null
  const defaultValue = element.defaultValue === undefined ? undefined : element.defaultValue
  const selectedCase = noValue ? defaultValue : values[condition]

  const rendering: Record<string, JSX.Element | null> = {}
  for (const [value, element] of Object.entries(cases)) {
    rendering[value] = RenderingEngine.render({ values: props.values, setup: props.setup, element })
  }

  return <>
    {
      Object.entries(rendering).map(([value, jsx]) => (
        <div key={value} style={{ display: `${value}` === `${selectedCase}` ? 'block' : 'none' }}>
          {jsx}
        </div>)
      )
    }
  </>
}
