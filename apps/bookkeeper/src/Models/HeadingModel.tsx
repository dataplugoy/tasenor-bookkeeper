import { AccountNumber, ID } from '@tasenor/common'
import Model from './Model'
import DatabaseModel from './DatabaseModel'

class HeadingModel extends Model {

  declare id: ID
  declare number: AccountNumber
  declare level: number
  declare text: string
  declare parent: DatabaseModel

  constructor(parent, init = {}) {
    super(parent, {
      id: null,
      // The account number that this heading refers to.
      number: null,
      // Numeric level 0...N-1.
      level: null,
      // Heading text.
      text: null
    }, {}, init)
  }

  /**
   * Get the database this entry belongs to.
   */
  get database(): DatabaseModel {
    return this.parent
  }

  getObjectType() {
    return 'Heading'
  }
}

export default HeadingModel
