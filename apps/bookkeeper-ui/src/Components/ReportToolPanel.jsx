import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react'
import { withTranslation, Trans } from 'react-i18next'
import Store from '../Stores/Store'
import { IconSpacer, IconButton, Title, downloadUrl } from '@dataplug/tasenor-common-ui'
import Configuration from '../Configuration'
import { haveCursor } from '@dataplug/tasenor-common'
import withStore from '../Hooks/withStore'

const ICONS = {
  'option-compact': 'compact',
  'option-quarter1': 'quarter1',
  'option-quarter2': 'quarter2',
  'option-quarter3': 'quarter3',
  'option-full': 'quarter4',
  'option-byTags': 'tag'
}

@withTranslation('translations')
@withStore
@observer
class ReportToolPanel extends Component {

  componentDidMount() {
    const cursor = haveCursor()
    cursor.registerTools(this)
  }

  componentWillUnmount() {
    const cursor = haveCursor()
    cursor.registerTools(null)
  }

  keyIcon1() {
    return this.handleRadio('1')
  }

  keyIcon2() {
    return this.handleRadio('2')
  }

  keyIcon3() {
    return this.handleRadio('3')
  }

  keyIcon4() {
    return this.handleRadio('4')
  }

  keyIcon5() {
    return this.handleRadio('5')
  }

  keyIcon6() {
    return this.handleRadio('6')
  }

  keyIcon7() {
    return this.handleRadio('7')
  }

  keyIcon8() {
    return this.handleRadio('8')
  }

  keyIcon9() {
    return this.handleRadio('9')
  }

  keyIconE() {
    return this.handleToggle('E')
  }

  keyIconR() {
    return this.handleToggle('R')
  }

  keyIconT() {
    return this.handleToggle('T')
  }

  keyIconY() {
    return this.handleToggle('Y')
  }

  keyIconU() {
    return this.handleToggle('U')
  }

  keyIconI() {
    return this.handleToggle('I')
  }

  keyIconO() {
    return this.handleToggle('O')
  }

  handleToggle(letter) {
    if (this.toggleKeys) {
      const fn = this.toggleKeys[letter]
      if (fn) {
        fn()
        return { preventDefault: true }
      }
    }
  }

  handleRadio(letter) {
    if (this.radioKeys) {
      const fn = this.radioKeys[letter]
      if (fn) {
        fn()
        return { preventDefault: true }
      }
    }
  }

  keyIconP() {
    window.print()
    return { preventDefault: true }
  }

  keyIconD() {
    const store = this.props.store
    const url = `${Configuration.UI_API_URL}${store.report.getUrl()}&csv`
    downloadUrl(url, store.token, store.report.fileName())
    return { preventDefault: true }
  }

  render() {
    const store = this.props.store

    if (!store.isLoggedIn()) {
      return ''
    }

    this.radioKeys = {}
    this.toggleKeys = {}

    const onToggle = (option) => {
      runInAction(() => {
        store.report.config[option] = !store.report.config[option]
        store.fetchReport(store.db, store.periodId, store.report.format)
      })
    }

    const options = store.report ? Object.keys({ ...store.report.options }) : []

    const buttons = [
      <IconButton key="button-print" onClick={() => this.keyIconP()} title="print" shortcut="P" icon="print"></IconButton>,
      <IconButton key="button-download" onClick={() => this.keyIconD()} title="download-csv" shortcut="C" icon="download"></IconButton>
    ]

    if (options.length) {
      buttons.push(<IconSpacer key="space"/>)
      let toggleKeys = 0
      let radioKeys = 0
      let shortcut
      options.forEach((option, index) => {
        const radioKey = '1234567890'
        const toggleKey = 'ERTYUIO'
        const [optionType, optionArg1] = store.report.options[option].split(':')
        const name = `option-${option}`
        switch (optionType) {
          case 'boolean':
            shortcut = toggleKey[toggleKeys]
            buttons.push(<IconButton
              id={name}
              key={name}
              shortcut={shortcut}
              pressKey={`Icon${shortcut}`}
              toggle={store.report.config[option]}
              title={name}
              icon={ICONS[name] || 'unknown'}>
            </IconButton>)
            this.toggleKeys[shortcut] = () => onToggle(option)
            toggleKeys++
            break
          case 'radio':
            shortcut = radioKey[radioKeys]
            buttons.push(<IconButton
              id={name}
              key={name}
              shortcut={shortcut}
              pressKey={`Icon${shortcut}`}
              toggle={store.report.config[option]}
              title={name}
              icon={ICONS[name] || 'unknown'}>
            </IconButton>)
            this.radioKeys[shortcut] = () => {
              runInAction(() => {
                Object.entries(store.report.options).forEach(([opt, type]) => {
                  if (type.startsWith('radio:' + optionArg1)) {
                    store.report.config[opt] = false
                  }
                })
                onToggle(option)
              })
            }
            radioKeys++
            break
          default:
            throw new Error(`Unsupported report option type ${optionType}`)
        }
      })
    }

    return (
      <div className="ToolPanel">
        {!store.report && <Title><Trans>No Report Selected</Trans></Title>}
        {store.report && <Title>{this.props.t('report-' + store.report.format)}</Title>}
        {store.report && buttons}
      </div>
    )
  }
}

ReportToolPanel.propTypes = {
  t: PropTypes.func,
  store: PropTypes.instanceOf(Store)
}

export default ReportToolPanel
