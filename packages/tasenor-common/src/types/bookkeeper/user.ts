import { ID } from '../../process_types'

export interface UserDataModel {
  id: ID,
  name: string,
  email: string,
  disabled: boolean,
  config: Record<string, unknown>
}
