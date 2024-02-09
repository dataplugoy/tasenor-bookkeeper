import { Timestring } from '@tasenor/common'

/**
 * Commit data.
 */
export interface GitBackupCommit {
  hash: string
  date: Timestring
  message: string
  author: string
}
