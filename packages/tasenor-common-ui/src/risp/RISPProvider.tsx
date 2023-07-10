import { ActionEngine, debugActionHandler, patchActionHandler, postActionHandler } from './ActionEngine'
import { RenderingEngine } from './RenderingEngine'
import { BooleanRenderer, BoxRenderer, ButtonRenderer, CaseRenderer, FlatRenderer, HtmlRenderer, MessageRenderer, NumberRenderer, RadioRenderer, TextFileLineRenderer, TextRenderer, YesNoRenderer, AccountRenderer, CurrencySelectorRenderer, RuleEditorRenderer, TagsSelectorRenderer } from '../elements'
import { saveSettingActionHandler } from './SaveSettings'

let onBlurHook, onFocusHook

export type RISPProviderProps = {
  children: JSX.Element
  onInit?: () => void
  onBlur?: () => void | Promise<void>
  onFocus?: () => void | Promise<void>
}

/**
 * Register all renderers and action handlers.
 */
export const RISPProvider = (props: RISPProviderProps) => {
  const { onBlur, onFocus, children } = props
  onBlurHook = onBlur
  onFocusHook = onFocus

  RenderingEngine.register('account', AccountRenderer)
  RenderingEngine.register('boolean', BooleanRenderer)
  RenderingEngine.register('box', BoxRenderer)
  RenderingEngine.register('button', ButtonRenderer)
  RenderingEngine.register('case', CaseRenderer)
  RenderingEngine.register('currency', CurrencySelectorRenderer)
  RenderingEngine.register('flat', FlatRenderer)
  RenderingEngine.register('html', HtmlRenderer)
  RenderingEngine.register('message', MessageRenderer)
  RenderingEngine.register('number', NumberRenderer)
  RenderingEngine.register('radio', RadioRenderer)
  RenderingEngine.register('ruleEditor', RuleEditorRenderer)
  RenderingEngine.register('tags', TagsSelectorRenderer)
  RenderingEngine.register('text', TextRenderer)
  RenderingEngine.register('textFileLine', TextFileLineRenderer)
  RenderingEngine.register('yesno', YesNoRenderer)

  ActionEngine.register('debug', debugActionHandler)
  ActionEngine.register('patch', patchActionHandler)
  ActionEngine.register('post', postActionHandler)
  ActionEngine.register('saveSettings', saveSettingActionHandler)

  if (props.onInit) {
    props.onInit()
  }

  return children
}

/**
 * Extrnal calling interface for hooks.
 */
RISPProvider.onBlur = () => {
  if (onBlurHook) onBlurHook()
}

RISPProvider.onFocus = () => {
  if (onFocusHook) onFocusHook()
}
