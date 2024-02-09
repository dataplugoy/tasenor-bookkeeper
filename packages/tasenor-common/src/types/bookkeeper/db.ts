import { ID, Timestring, UserDataModel } from '../..'

export interface DbConfigModel {
  isCreator?: true
}

export interface DbDataModel {
  id: ID
  name: string
  created: Timestring
  users: {
    user: UserDataModel
    config: DbConfigModel
    created: Timestring
  }[]
}
