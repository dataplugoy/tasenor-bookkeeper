/* eslint-disable camelcase */
import fs from 'fs'
import mime from 'mime-types'
import { Command } from '.'
import { ArgumentParser } from 'argparse'
import { ImportState, ProcessConfig, ProcessModelData, ProcessStepModelData, RuleEditorElement, TransactionDescription, error, log } from '@dataplug/tasenor-common'

type ProcessPostResponse = { processId: number, step: number, status: string }
type ProcessGetResponse = { steps: ProcessStepModelData[] }

class ImportCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const ls = sub.add_parser('ls', { help: 'List all imports' })
    ls.set_defaults({ subCommand: 'ls' })
    ls.add_argument('db', { help: 'Name of the database' })
    ls.add_argument('name', { help: 'Name of the importer' })

    const show = sub.add_parser('show', { help: 'Display import process in detail' })
    show.set_defaults({ subCommand: 'show' })
    show.add_argument('db', { help: 'Name of the database' })
    show.add_argument('name', { help: 'Name of the importer' })
    show.add_argument('id', { help: 'Import number' })

    const create = sub.add_parser('create', { help: 'Import a file' })
    create.set_defaults({ subCommand: 'create' })
    create.add_argument('--first', { help: 'First date of the allowed period YYYY-MM-DD', default: '1900-01-01' })
    create.add_argument('--last', { help: 'Final date of the allowed period YYYY-MM-DD', default: '2999-12-31' })
    create.add_argument('--answers', { help: 'Answer file', required: false })
    create.add_argument('db', { help: 'Name of the database' })
    create.add_argument('name', { help: 'Name of the importer' })
    create.add_argument('file', { help: 'Path to the file(s) to import', nargs: '+' })
  }

  async ls() {
    const { db, name } = this.args
    const importer = await this.importer(db, name)
    const resp = await this.get(`/db/${db}/import/${importer.id}`)
    this.out('import', resp)
  }

  async show() {
    const { db, name, id } = this.args
    const importer = await this.importer(db, name)
    const resp = await this.get(`/db/${db}/import/${importer.id}/process/${id}`) as ProcessGetResponse

    const steps: (ProcessStepModelData & { state: ImportState})[] = []

    for (const step of resp.steps) {
      const resp = await this.get(`/db/${db}/import/${importer.id}/process/${id}/step/${step.number}`) as { state: ImportState }
      steps.push({ ...step, state: resp.state as ImportState })
    }

    for (const step of steps) {
      if (step.directions && step.directions.element) {
        const element: RuleEditorElement = step.directions.element as RuleEditorElement
        if (element.config) {
          element.config = '* * * config * * *' as unknown as ProcessConfig
        }
      }
    }

    if (this.args.json) {
      this.out('import', steps)
    } else {
      for (const step of steps) {
        const state = step.state
        console.log()
        console.log(`Step #${step.number}`)
        console.log('Action:', step.action)
        console.log('Direction:', step.directions && step.directions.type)
        console.log('State:')
        console.log(`  Files: ${Object.keys(state.files).join(', ')}`)
        console.log(`  Stage: ${state.stage}`)
        if (state.output) {
          console.log('  Output:', state.output)
        }
        if (state.segments) {
          console.log(`  Segments: ${Object.keys(state.segments).join(', ')}`)
        }
        if (state.result !== undefined) {
          console.log('  Results:')
          Object.keys(state.result).forEach(segmentId => {
            console.log(`=== ${segmentId} ===`)
            const result: TransactionDescription = state.result as TransactionDescription
            console.dir(result[segmentId], { depth: null })
          })
        }
        // console.log()
        // console.log(step.state)
        // console.log()
      }
    }

  }

  async create() {
    const { db, name, file, answers, first, last } = this.args
    const importer = await this.importer(db, name)
    const encoding = 'base64'
    const files: Record<string, string>[] = []
    for (const filePath of (file || [])) {
      const data = fs.readFileSync(filePath).toString(encoding)
      files.push({
        name: filePath,
        encoding,
        type: mime.lookup(filePath),
        data
      })
    }
    const answersArg = answers ? await this.jsonData(answers) : null

    const resp: ProcessPostResponse = await this.post(`/db/${db}/importer/${importer.id}`, {
      firstDate: first,
      lastDate: last,
      files
    })
    this.out('import', resp)

    if (answersArg) {
      log(`Uploading answers to process #${resp.processId}`)
      const resp2 = await this.post(`/db/${db}/import/${importer.id}/process/${resp.processId}`, {
        answer: answersArg
      })
      this.out('import', resp2)
    }
  }

  print(data: ProcessModelData[] | ProcessPostResponse) {
    if ('processId' in data && 'step' in data) {
      log(`Process ID: ${data.processId}, Step: ${data.step}, ${data.status}`)
      return
    }
    if ('processId' in data && 'status' in data && data.length === undefined) {
      if (data.status === 'CRASHED') {
        error(`Process ID: ${data.processId}, ${data.status}`)
      } else {
        log(`Process ID: ${data.processId}, ${data.status}`)
      }
      return
    }
    for (const imp of data.sort((a, b) => (a.id || 0) - (b.id || 0))) {
      const { id, name, status, error } = imp
      console.log(`#${id} ${name} ${status}`)
      if (error) {
        console.log('  ', error)
      }
      console.log()
    }

  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default ImportCommand
