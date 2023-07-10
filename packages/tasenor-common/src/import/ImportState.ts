import { ImportSegment, SegmentId, TextFileLine } from "./TextFileLine"

/**
 * Initial state of the text file import.
 */
export type ImportStateText<StageType> = {
  stage: StageType
  files: {
    [text:string]: {
      lines: TextFileLine[]
    }
  }
  segments?: Record<SegmentId, ImportSegment>
  result?: Record<SegmentId, unknown>
  output?: Record<string, unknown>
}

/**
 * Union of all import states.
 */
export type ImportState = ImportStateText<'initial'> | ImportStateText<'segmented'> | ImportStateText<'classified'> | ImportStateText<'analyzed'> | ImportStateText<'executed'> | ImportStateText<'rolledback'>

export function isImportState(obj: unknown): obj is ImportState {
  if (typeof obj !== 'object') {
    return false
  }
  if (obj === null) {
    return false
  }
  if (!('stage' in obj) || !('files' in obj)) {
    return false
  }
  if (typeof obj['stage'] !== 'string') {
    return false
  }
  if (!['initial', 'segmented', 'classified', 'analyzed', 'executed'].includes(obj['stage'])) {
    return false
  }
  return true
}
