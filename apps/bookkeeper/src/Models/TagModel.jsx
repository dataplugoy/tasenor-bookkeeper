import { runInAction } from 'mobx'
import Model from './Model'
import Configuration from '../Configuration'
import { net } from '@tasenor/common'

class TagModel extends Model {

  constructor(parent, init = {}) {
    super(parent, {
      id: null,
      // String to be recognized as a tag without `[]`.
      tag: null,
      // Description of the tag.
      name: null,
      // Image data as a base64 encoded string.
      picture: null,
      // Mime type of the picture.
      mime: null,
      // Any string as a grouping category for the tag.
      type: null,
      // Order number of the tag for display.
      order: null
    }, {}, init)
  }

  getSortKey() {
    return this.order
  }

  getObjectType() {
    return 'Tag'
  }

  async save() {
    return this.store.request('/db/' + this.db + '/tags/' + (this.id || ''), this.id ? 'PATCH' : 'POST', this.toJSON())
      .then((res) => {
        runInAction(() => {
          if (!this.id) {
            this.id = res.id
          }
          this.database.updateTag(this)
        })
        return res
      })
  }

  async delete() {
    const path = '/db/' + this.db + '/tags/' + this.id
    await this.store.request(path, 'DELETE')
    runInAction(() => {
      this.database.deleteTag(this)
      if (this.store.period) {
        this.store.period.refreshTags()
      }
    })
  }

  /**
   * Construct URL for API image viewer.
   */
  get url() {
    const token = net.getConf(Configuration.UI_API_URL, 'token')
    return `${Configuration.UI_API_URL}/db/${this.store.db}/tags/${this.id}/view?token=${token}`
  }

  get database() {
    return this.parent
  }

  /**
   * Extract tags and text from the description string.
   * @param {string} desc
   * @return [String, String[]] Description and list of tags.
   */
  static desc2tags(desc) {
    const ret = [desc, []]
    const regex = /^((\[[a-zA-Z0-9]+\])+)\s*(.*)/.exec(desc)
    if (regex && regex[1]) {
      ret[0] = regex[3]
      ret[1] = regex[1].substr(1, regex[1].length - 2).split('][')
    }
    return ret
  }
}

export default TagModel
