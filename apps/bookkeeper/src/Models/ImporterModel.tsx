import { runInAction } from 'mobx'
import Model from './Model'
import { ID } from '@tasenor/common'

class ImporterModel extends Model {

  declare id: ID
  declare name: string
  declare config: Record<string, unknown>

  constructor(parent, init = {}) {
    super(parent, {
      id: null,
      // Importer name.
      name: null,
      // Importer configuration.
      config: {}
    }, {}, init)
  }

  getObjectType() {
    return 'Importer'
  }

  async save() {
    return this.store.request('/db/' + this.db + '/importer/' + (this.id || ''), this.id ? 'PATCH' : 'POST', this.toJSON())
      .then((res) => {
        runInAction(() => {
          if (!this.id) {
            this.id = res.id
          }
        })
        return res
      })
  }
}

export default ImporterModel
