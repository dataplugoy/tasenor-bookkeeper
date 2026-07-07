import { Command } from '.'
import { ArgumentParser } from 'argparse'
import { TasenorPlugin } from '@tasenor/common'

class PluginCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const ls = sub.add_parser('ls', { help: 'List plugins and their status' })
    ls.set_defaults({ subCommand: 'ls' })
    ls.add_argument('--short', '-s', { action: 'store_true', help: 'If given, show just plugin codes in one line', required: false })
    ls.add_argument('--installed', '-i', { action: 'store_true', help: 'If given, show only installed plugins', required: false })
  }

  print(data: TasenorPlugin[]) {
    for (const plugin of data.sort((a, b) => parseInt(a.id + '' || '0') - parseInt(b.id + '' || '0'))) {
      const { id, code, installedVersion, use, type } = plugin
      console.log(`#${id} ${code} ${use} ${type} ${installedVersion ? '[v' + installedVersion + ']' : ''}`)
    }
  }

  async ls() {
    const { short, installed } = this.args
    let resp: TasenorPlugin[] = await this.get('/plugins')
    if (installed) {
      resp = resp.filter(plugin => plugin.installedVersion)
    }
    if (short) {
      console.log(resp.map(plugin => plugin.code).join(' '))
      return
    }
    this.out('plugin', resp)
  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default PluginCommand
