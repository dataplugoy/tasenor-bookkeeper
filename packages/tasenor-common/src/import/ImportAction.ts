import { SegmentId } from './TextFileLine'

/**
 * Action for updating process configuration.
 */
export interface ImportOpAction {
  op: 'segmentation' | 'classification' | 'analysis' | 'execution'
}
export function isImportOpAction(obj: unknown): obj is ImportOpAction {
  if (typeof obj === 'object' && obj !== null) {
    if ('op' in obj) {
      return ['segmentation', 'classification', 'analysis', 'execution'].includes((obj as { op: string }).op)
    }
  }
  return false
}

/**
 * Actions for changing the import phases.
 */
export interface ImportConfigureAction {
  configure: Record<string, unknown>
}
export function isImportConfigureAction(obj: unknown): obj is ImportConfigureAction {
  if (typeof obj === 'object' && obj !== null) {
    if ('configure' in obj) {
      return typeof obj.configure === 'object' && obj.configure !== null
    }
  }
  return false
}

/**
 * Actions for responding to questions.
 */
export interface ImportAnswerAction {
  answer: Record<SegmentId, Record<string, unknown>>
}
export function isImportAnswerAction(obj: unknown): obj is ImportAnswerAction {
  if (typeof obj === 'object' && obj !== null) {
    if ('answer' in obj) {
      return typeof obj.answer === 'object' && obj.answer !== null
    }
  }
  return false
}

/**
 * Retry processing (after some code changes).
 */
export type ImportRetryAction = {
  retry: true
}
export function isImportRetryAction(obj: unknown): obj is ImportRetryAction {
  return (typeof obj === 'object' && obj !== null && ('retry' in obj) && obj.retry === true)
}

/**
 * Rollback process.
 */
export type ImportRollbackAction = {
  rollback: true
}
export function isImportRollbackAction(obj: unknown): obj is ImportRollbackAction {
  return (typeof obj === 'object' && obj !== null && ('rollback' in obj) && obj.rollback === true)
}

/**
 * Import step as an action.
 */
export type ImportAction = ImportOpAction | ImportConfigureAction | ImportAnswerAction | ImportRetryAction | ImportRollbackAction

export function isImportAction(obj: unknown): obj is ImportAction {
  return isImportOpAction(obj) || isImportConfigureAction(obj) || isImportAnswerAction(obj) || isImportRetryAction(obj)
}
