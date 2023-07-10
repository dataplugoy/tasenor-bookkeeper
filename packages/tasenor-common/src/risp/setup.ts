import { Store } from '../types'

/**
 * A setup for RISP used in Tasenor project.
 */
export type TasenorSetup = {
  baseUrl: string
  store: Store
  token: string
  errorMessage: (msg: string) => void
  successMessage: (msg: string) => void
}
