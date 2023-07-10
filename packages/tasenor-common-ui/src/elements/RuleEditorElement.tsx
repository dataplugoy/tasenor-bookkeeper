import React from 'react'
import { RuleEditorElement, RenderingProps } from '@dataplug/tasenor-common'
import { RuleEditor, RuleEditorContinueOption, RuleEditorValues } from '../bookkeeper'
import { Renderer } from '../risp/RenderingEngine'

export const RuleEditorRenderer: Renderer = (props: RenderingProps<RuleEditorElement>) => {

  const { element, setup, values } = props
  const { lines, cashAccount, options, config } = element

  return <RuleEditor
    store={setup.store}
    config={config}
    lines={lines}
    options={options}
    cashAccount={cashAccount}
    values={values[element.name] as Partial<RuleEditorValues>}
    onChange={(newValue) => {
      element.triggerHandler && element.triggerHandler({ type: 'onChange', name: element.name, value: newValue }, props)
    }}
    onContinue={(option: RuleEditorContinueOption) => {
      const opts: RenderingProps<RuleEditorElement> = props
      opts.values.continueOption = option
      element.triggerHandler && element.triggerHandler({ type: 'onContinue' }, opts)
    }}
    onCreateRule={() => {
      element.triggerHandler && element.triggerHandler({ type: 'onCreateRule' }, props)
    }}
  />
}
