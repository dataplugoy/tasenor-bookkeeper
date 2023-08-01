import { useTranslation } from 'react-i18next'
import { haveCatalog } from '@tasenor/common'

export interface LocalizeProps {
  date?: string | number
  children?: JSX.Element
}

export const Localize = (props: LocalizeProps) => {

  const catalog = haveCatalog()
  const { t } = useTranslation()

  const localize = (text) => {
    let match
    do {
      match = /(\{(\d\d\d\d-\d\d-\d\d)\})/.exec(text)
      if (match) {
        text = text.replace(match[1], catalog.date2str(match[2]))
      } else {
        match = /(\{(.*?)\})/.exec(text)
        if (match) {
          text = text.replace(match[1], t(match[2]))
        }
      }
    } while (match)

    return text
  }

  if (props.date) {
    return catalog.date2str(props.date)
  }
  const what = props.children
  if (what === undefined) {
    return ''
  }
  if (typeof what === 'string') {
    return localize(what)
  }
  return 'No localization available for ' + typeof what
}
