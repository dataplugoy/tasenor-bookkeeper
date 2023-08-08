import Model from './Model'

class NavigationTargetModel extends Model {

  // If set, this object is currently selected.
  declare selected: boolean
  // If set, then this object is now in editing mode (if applicable).
  declare edit: boolean
  // If set, the named sub-item column is currently selected.
  declare column: null | string
  // If set, this model is marked for deletion.
  declare askForDelete: boolean

  constructor(parent: Model, variables: Record<string, unknown>, extras: Record<string, unknown>, init: Record<string, unknown>, actions: string[] = []) {
    super(parent, variables, {
      ...extras,
      selected: false,
      edit: false,
      column: null,
      askForDelete: false
    }, init, actions)
  }

  /**
   * Find the DOM-element corresponding this element.
   */
  getElement() {
    const id: string = this.getId()
    return id ? document.getElementById(id) || null : null
  }

  /**
   * Cursor has entered this model.
   */
  enter() {
    this.selected = true
  }

  /**
   * Cursor has left this model.
   */
  leave() {
    this.selected = false
  }

  /**
   * Cursor has entered to the sub-item of this model.
   */
  enterSub(columnNumber) {
    this.column = this.columns()[columnNumber]
  }

  /**
   * Cursor has left the sub-item of this model.
   */
  leaveSub() {
    this.column = null
  }

  /**
   * Get the names of columns if this model has sub-items.
   */
  columns(): string[] {
    return []
  }

  /**
   * Get the sub-item instances if this model has any.
   */
  rows(): NavigationTargetModel[] {
    return []
  }

  /**
   * Get the geometry [columns, rows] of the sub-items or null if not supported.
   */
  geometry() {
    const rows = this.rows()
    if (!rows.length) {
      console.warn(`Cannot find any rows() for ${this.getObjectType()}Model.`)
      return null
    }
    const columns = rows[0].columns()
    if (!columns.length) {
      console.warn(`Cannot find any columns() for ${rows[0].getObjectType()}Model.`)
      return null
    }
    return [columns.length, rows.length]
  }

  /**
   * Check if this model can be edited now.
   */
  canEdit() {
    return false
  }

  /**
   * Mark this model for deletion request.
   */
  markForDeletion() {
    this.askForDelete = true
  }

  /**
   * Remove deletion request.
   */
  cancelDeletion() {
    this.askForDelete = false
  }

  /**
   * Start editing if capable.
   */
  turnEditorOn(cursor) {
    if (this.canEdit()) {
      this.edit = true
      cursor.editTarget = this
    }
  }

  /**
   * Stop editing.
   */
  turnEditorOff(cursor) {
    this.edit = false
    cursor.editTarget = null
  }
}

export default NavigationTargetModel
