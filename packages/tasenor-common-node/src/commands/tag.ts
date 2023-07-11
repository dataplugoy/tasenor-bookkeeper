/* eslint-disable camelcase */
import fs from 'fs'
import mimeTypes from 'mime-types'
import { log, TagModelData } from '@dataplug/tasenor-common'
import { Command } from '.'
import { ArgumentParser } from 'argparse'

class TagCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const ls = sub.add_parser('ls', { help: 'List all tags' })
    ls.set_defaults({ subCommand: 'ls' })
    ls.add_argument('db', { help: 'Name of the database' })
    ls.add_argument('--tags-only', { help: 'Show only tags', action: 'store_true', required: false })

    const download = sub.add_parser('download', { help: 'Download a tag image' })
    download.set_defaults({ subCommand: 'download' })
    download.add_argument('db', { help: 'Name of the database' })
    download.add_argument('tag', { help: 'Name of the tag' })

    const rm = sub.add_parser('rm', { help: 'Delete a tag' })
    rm.set_defaults({ subCommand: 'rm' })
    rm.add_argument('db', { help: 'Name of the database' })
    rm.add_argument('id', { help: 'ID of the tag' })

    const create = sub.add_parser('create', { help: 'Create a tag' })
    create.set_defaults({ subCommand: 'create' })
    create.add_argument('db', { help: 'Name of the database' })
    create.add_argument('tag', { help: 'Tag itself' })
    create.add_argument('name', { help: 'Description' })
    create.add_argument('type', { help: 'Group name of the tag' })
    create.add_argument('path', { help: 'Path to the file' })
    create.add_argument('order', { help: 'Ordering number for the tag', nargs: '?' })
  }

  async ls() {
    const { db, tags_only } = this.args
    const resp: TagModelData[] = await this.get(`/db/${db}/tags`)
    if (tags_only) {
      for (const tag of resp.map(t => t.tag)) {
        console.log(tag)
      }
    } else {
      this.out('tag', resp)
    }
  }

  print(data: TagModelData[]): void {
    for (const line of data.sort((a, b) => (a.id || 0) - (b.id || 0))) {
      const { id, tag, name, mime, type, order } = line
      console.log(`#${id} ${tag}\t${name}\t${mime}\t${type}\t${order}`)
    }
  }

  async rm() {
    const { db, id } = this.args
    await this.delete(`/db/${db}/tags/${id}`)
    log(`Tag ${id} deleted successfully.`)
  }

  async download() {
    const { db, tag } = this.args
    const tagArg = await this.tag(db, tag)
    const name = `${tagArg.tag}.${(tagArg.mime || '/bin').split('/')[1]}`
    const data = Buffer.from(tagArg.picture || '', 'base64')
    fs.writeFileSync(name, data)
    log(`Saved a tag to file ${name}.`)
  }

  async create() {
    const { db, tag, name, path, type } = this.args
    if (!path || !fs.existsSync(this.str(path))) {
      throw new Error(`File path ${path} does not exist.`)
    }
    const mime = mimeTypes.lookup(path)
    let order = this.num(this.args.order)
    if (!order) {
      const maxNumber: Record<string, number> = {}
      const old: TagModelData[] = await this.get(`/db/${db}/tags`)
      for (const tag of old) {
        if (!tag.type) {
          continue
        }
        maxNumber[tag.type] = Math.max(maxNumber[tag.type] || 0, tag.order)
      }
      order = (maxNumber[this.str(type)] || 0) + 1
    }
    const picture = fs.readFileSync(this.str(path)).toString('base64')

    const params = { tag, name, mime, type, order, picture }
    await this.post(`/db/${db}/tags`, params)
    log(`Tag ${tag} created successfully.`)
  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default TagCommand
