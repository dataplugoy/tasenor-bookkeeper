import pkg from '../package.json'
import { detect } from 'detect-browser'

const browser = detect()

const Configuration = {
  BROWSER: browser.name,
  OS: browser.os,
  VERSION: pkg.version,
  COMMAND_KEY: browser.os === 'iOS' ? '⌘' : 'Alt',
  COMMAND_KEY_MOD: browser.os === 'iOS' ? 'Meta' : 'Alt',
  // eslint-disable-next-line
  UI_API_URL: __UI_API_URL || ''
}

if (!Configuration.UI_API_URL) {
  throw new Error('Environment UI_API_URL is not set.')
}

export default Configuration
