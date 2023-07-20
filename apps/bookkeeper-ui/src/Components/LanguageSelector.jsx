import { inject } from 'mobx-react'
import React, { Component } from 'react'
import Flag from 'react-world-flags'
import i18n from '../i18n'
import Catalog from '../Stores/Catalog'
import PropTypes from 'prop-types'

@inject('catalog')
class LanguageSelector extends Component {

  setLanguage(lang) {
    localStorage.setItem('language', lang)
  }

  onChangeLanguage() {
    const languages = Object.keys(this.props.catalog.flags())
    const lang = i18n.language
    let current = languages.indexOf(lang)
    current++
    if (current >= languages.length) {
      current = 0
    }
    this.setLanguage(languages[current])
    document.location.reload()
  }

  render() {
    let lang = i18n.language
    const flags = this.props.catalog.flags()
    if (!flags[lang]) {
      lang = Object.keys(flags)[0]
      this.setLanguage(lang)
    }
    return <Flag code={flags[lang]} height="20" onClick={() => this.onChangeLanguage()} />
  }
}

LanguageSelector.propTypes = {
  catalog: PropTypes.instanceOf(Catalog),
}

export default LanguageSelector
