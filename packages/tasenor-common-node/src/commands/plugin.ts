import { Command } from '.'
import { ArgumentParser } from 'argparse'
import { log, TasenorPlugin } from '@dataplug/tasenor-common'

class PluginCommand extends Command {

  addArguments(parser: ArgumentParser): void {
    const sub = parser.add_subparsers()

    const ls = sub.add_parser('ls', { help: 'List plugins and their status' })
    ls.set_defaults({ subCommand: 'ls' })
    ls.add_argument('--short', '-s', { action: 'store_true', help: 'If given, show just plugin codes in one line', required: false })
    ls.add_argument('--installed', '-i', { action: 'store_true', help: 'If given, show only installed plugins', required: false })

    const install = sub.add_parser('install', { help: 'Install plugins' })
    install.set_defaults({ subCommand: 'install' })
    install.add_argument('code', { help: 'Plugin code', nargs: '+' })

    const rm = sub.add_parser('rm', { help: 'Uninstall plugins' })
    rm.set_defaults({ subCommand: 'rm' })
    rm.add_argument('code', { help: 'Plugin code', nargs: '+' })

    const rebuild = sub.add_parser('rebuild', { help: 'Rebuild UI with newly installed plugins' })
    rebuild.set_defaults({ subCommand: 'rebuild' })

    const reset = sub.add_parser('reset', { help: 'Remove all installed plugins' })
    reset.set_defaults({ subCommand: 'reset' })

    const refresh = sub.add_parser('refresh', { help: 'Reftresh the plugin list' })
    refresh.set_defaults({ subCommand: 'refresh' })
  }

  print(data: TasenorPlugin[]) {
    for (const plugin of data.sort((a, b) => a.id - b.id)) {
      const { id, code, installedVersion, use, type } = plugin
      console.log(`#${id} ${code} ${use} ${type} ${installedVersion ? '[v' + installedVersion + ']' : ''}`)
    }
  }

  async ls() {
    const { short, installed } = this.args
    let resp: TasenorPlugin[] = await this.getUi('/internal/plugins')
    if (installed) {
      resp = resp.filter(plugin => plugin.installedVersion)
    }
    if (short) {
      console.log(resp.map(plugin => plugin.code).join(' '))
      return
    }
    this.out('plugin', resp)
  }

  async install() {
    const { code } = this.args
    const plugins: TasenorPlugin[] = await this.plugin(code) as TasenorPlugin[]
    for (const plugin of plugins) {
      const version = plugin.availableVersion
      if (!version) {
        throw new Error(`No version available of plugin ${code}.`)
      }
      log(`Installing plugin ${plugin.code} version ${version}`)
      await this.postUi('/internal/plugins', { code: plugin.code, version })
    }
  }

  async rm() {
    const { code } = this.args
    const plugins: TasenorPlugin[] = await this.plugin(code) as TasenorPlugin[]
    for (const plugin of plugins) {
      log(`Removing plugin ${plugin.code}`)
      await this.deleteUi('/internal/plugins', { code: plugin.code })
    }
  }

  async rebuild() {
    log('Rebuilding plugins')
    await this.getUi('/internal/plugins/rebuild')
  }

  async refresh() {
    log('Refreshing plugins')
    await this.getUi('/internal/plugins')
  }

  async reset() {
    log('Removing all plugins')
    await this.getUi('/internal/plugins/reset')
  }

  async run() {
    await this.runBy('subCommand')
  }
}

export default PluginCommand
