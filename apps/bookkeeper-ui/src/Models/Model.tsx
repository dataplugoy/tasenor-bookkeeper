import { action, AnnotationsMap, makeObservable, observable, runInAction } from 'mobx'
import Store from '../Stores/Store'
import { ID } from '@dataplug/tasenor-common'

class Model {

  id: ID
  // eslint-disable-next-line no-use-before-define
  parent: Model
  store: Store
  variables: string[]

  constructor(parent: Model, variables: Record<string, unknown>, extras: Record<string, unknown>, init: Record<string, unknown>, actions: string[] = []) {
    this.parent = parent
    if (parent instanceof Store) {
      this.store = parent
    } else {
      this.store = parent.store
    }
    this.variables = Object.keys(variables)
    if (!parent) {
      console.warn(`No parent given for ${this.constructor.name}: ${JSON.stringify(variables)}`)
    }
    Object.assign(this, variables)
    Object.assign(this, extras)

    const annotations: AnnotationsMap<this, never> = {}
    Object.assign(annotations, this.variables.reduce((prev, curr) => ({ ...prev, [curr]: observable }), {}))
    Object.assign(annotations, Object.keys(extras).reduce((prev, curr) => ({ ...prev, [curr]: observable }), {}))
    Object.assign(annotations, actions.reduce((prev, curr) => ({ ...prev, [curr]: action }), {}))
    makeObservable(this, annotations)

    init = this.initialize(init)
    Object.keys(variables).forEach((key) => {
      if (key in init) {
        this[key] = init[key]
      }
    })
  }

  /**
   * Construct a JSON-object compatible with DB format.
   */
  toJSON() {
    const ret: Record<string, unknown> = {}
    this.variables.forEach((k) => (ret[k] = this[k]))
    if (ret.id === null) {
      delete ret.id
    }
    return ret
  }

  /**
   * Get the name of class without 'Model' postfix.
   */
  getObjectType() {
    throw new Error('Model does not implement getObjectType().')
  }

  /**
   * If sortable model, get the value to be used for sorting (default: use `id`).
   */
  getSortKey(): string | number | null | (string | number | null)[] {
    return this.id
  }

  /**
   * Hook to modify initialization arguments.
   * @param {Object} data
   */
  initialize(data) {
    return data
  }

  /**
   * Get DOM-element ID for the object.
   * @return {String}
   */
  getId(): string {
    throw new Error(`Model for ${this.getObjectType()} does not implement getId().`)
  }

  /**
   * Get detail viewing URL for the object.
   * @return {String}
   */
  getUrl(): string {
    throw new Error(`Model for ${this.getObjectType()} does not implement getUrl().`)
  }

  /**
   * Get visual presentation of the given field: if there is `get.<field>` function, use it, otherwise field value itself.
   * @param {String} field
   */
  getView(field) {
    const name = `get.${field}`
    return name in this ? this[name]() : this[field]
  }

  /**
   * Get visual presentation of the given field for editable value. Defaults to view.
   * @param {String} field
   */
  getEdit(field) {
    const name = `get.edit.${field}`
    return name in this ? this[name]() : this.getView(field)
  }

  /**
   * Check if the value can be converted to the given field.
   * @param {String} field
   * @param {Any} value
   * @return {string|true} Error message if not valid.
   */
  validate(field, value) {
    const name = `validate.${field}`
    return name in this ? this[name](value) : true
  }

  /**
   * Calculate proposal for the field value based on partial value given.
   * @param {String} field
   * @param {String} value
   */
  async proposal(field, value) {
    const name = `proposal.${field}`
    return name in this ? this[name](value) : null
  }

  /**
   * Change the value of one field of this model.
   * @param {String} field
   * @param {Any} value
   */
  async change(field, value) {
    const name = `change.${field}`
    runInAction(() => {
      if (name in this) {
        this[name](value)
      } else {
        this[field] = value
      }
    })
  }

  /**
   * Write this instance to the store.
   */
  async save() {
    throw new Error(`The model ${this.getObjectType()} does not implement save().`)
  }

  /**
   * Delete this instance from the store.
   */
  async delete() {
    throw new Error(`The model ${this.getObjectType()} does not implement delete().`)
  }

  /**
   * Get the settings.
   */
  get settings() {
    return this.store.settings
  }

  /**
   * Get the settings.
   */
  get catalog() {
    return this.store.catalog
  }

  /**
   * Name of the current database.
   */
  get db() {
    return this.store.db
  }

  /**
   * Construct a sorting function for sorting model instances.
   */
  static sorter(reverse = false) {
    const one = reverse ? -1 : 1
    const cmp = (a, b) => (a < b ? -one : (a > b ? one : 0))
    return (a, b) => {
      const aKey = a.getSortKey()
      const bKey = b.getSortKey()
      if (aKey instanceof Array && bKey instanceof Array) {
        const N = Math.max(aKey.length, bKey.length)
        for (let i = 0; i < N; i++) {
          const res = cmp(aKey[i], bKey[i])
          if (res) {
            return res
          }
        }
        return 0
      } else {
        return cmp(aKey, bKey)
      }
    }
  }
}

export default Model
