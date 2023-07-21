import { useLocation, useNavigate, Location } from 'react-router-dom'
import { DatabaseName, isDatabaseName, ID } from '@dataplug/tasenor-common'

// TODO: This could belong to bookkeeper repo. In future generic base could be here.
export type MainMenu = '' | 'admin' | 'dashboard' | 'txs' | 'account' | 'report' | 'tools' | 'data' | 'settings' | 'classop'
const mainMenuSet = new Set(['', 'admin', 'dashboard', 'txs', 'account', 'report', 'tools', 'data', 'settings', 'classop'])
export const isMainMenu = (name: unknown): name is MainMenu => typeof name === 'string' && mainMenuSet.has(name)

export class MenuState {
  db: DatabaseName
  main: MainMenu
  periodId: ID
  accountId: ID
  side: string
  attrs: Record<string, string>
  indirectPath: boolean

  navigator: (url: string) => void

  constructor(loc: Location, navigator) {
    this.db = '' as DatabaseName
    this.main = ''
    this.periodId = null
    this.accountId = null
    this.side = ''
    this.attrs = {}
    this.indirectPath = false

    this.navigator = navigator

    if (loc) {
      if (loc.search.startsWith('?path=')) {
        this.indirectPath = true
        const search: Record<string, string> = loc.search.substr(1).split('&').map(s => s.split('=')).reduce((prev, cur) => ({ [cur[0]]: cur[1], ...prev }), {})
        const [, db, main, periodId, accountId, side] = search.path.split('/')
        this.parse({ db, main, periodId, accountId, side, ...search })
        delete this.attrs.path
        delete this.attrs.indirect
      } else {
        const [, db, main, periodId, accountId, side] = loc.pathname.split('/')
        const search = loc.search.length ? loc.search.substr(1).split('&').map(s => s.split('=')).reduce((prev, cur) => ({ [cur[0]]: cur[1], ...prev }), {}) : {}
        this.parse({ db, main, periodId, accountId, side, ...search })
      }
    }
  }

  /**
   * Collect valid path values from records and ignore the rest.
   */
  parse(params: Record<string, string | null>): void {
    const { db, main, periodId, accountId, side } = params
    Object.keys(params).forEach(key => {
      switch (key) {
        case 'db':
          this.db = isDatabaseName(db) ? db : '' as DatabaseName
          break
        case 'main':
          this.main = isMainMenu(main) ? main : ''
          break
        case 'periodId':
          this.periodId = periodId === '' || periodId === null ? null : parseInt(periodId)
          break
        case 'accountId':
          this.accountId = accountId === '' || accountId === null ? null : parseInt(accountId)
          break
        case 'side':
          this.side = side || ''
          break
        default:
          if (params[key] !== null) {
            this.attrs[key] = params[key] || ''
          } else {
            delete this.attrs[key]
          }
      }
    })
  }

  go(to: Record<string, string | null>): void {
    this.parse(to)
    this.navigator(this.url)
  }

  get(variable: string) {
    switch (variable) {
      case 'db':
      case 'main':
        return this[variable] === '_' ? '' : this[variable]
      case 'periodId':
      case 'accountId':
      case 'side':
        return this[variable]
      default:
        return this.attrs[variable]
    }
  }

  get url(): string {
    let url = `/${this.db || '_'}/${this.main || '_'}/${this.periodId || ''}/${this.accountId || ''}/${this.side}`
    url = url.replace(/\/+$/, '')
    if (this.attrs.indirect === 'yes') {
      delete this.attrs.indirect
      this.indirectPath = true
    }
    const attrs = Object.keys(this.attrs).map(k => `${k}=${encodeURIComponent(this.attrs[k])}`)
    if (this.indirectPath) {
      return `?path=${url}&${attrs.join('&')}`
    } else {
      if (attrs.length) {
        url += `?${attrs.join('&')}`
      }
      return url
    }
  }
}

// TODO: Rename. Overlaps with react-router.
export const useNavigation = (): MenuState => {
  const loc = useLocation()
  const nav = useNavigate()
  return new MenuState(loc, nav)
}
