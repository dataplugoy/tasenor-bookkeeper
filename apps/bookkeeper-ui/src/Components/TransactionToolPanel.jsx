import { haveCursor, net } from '@dataplug/tasenor-common'
import { TagChip, IconButton, Title } from '@dataplug/tasenor-common-ui'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Configuration from '../Configuration'
import { observer } from 'mobx-react'
import Store from '../Stores/Store'
import { Trans } from 'react-i18next'
import i18n from '../i18n'
import { action, runInAction } from 'mobx'
import withStore from '../Hooks/withStore'

@withStore
@observer
class TransactionToolPanel extends Component {

  @action
  componentDidMount() {
    const cursor = haveCursor()
    cursor.registerTools(this)
    runInAction(() => (this.props.store.tools.tagDisabled = {}))
  }

  componentWillUnmount() {
    const cursor = haveCursor()
    cursor.registerTools(null)
  }

  keyIconD = () => {
    const store = this.props.store
    const { db, periodId, accountId } = store
    const lang = i18n.language
    const url = `${Configuration.UI_API_URL}/db/${db}/report/account/${periodId}/${accountId}?csv&lang=${lang}`

    fetch(url, {
      method: 'GET',
      headers: new Headers({
        Authorization: 'Bearer ' + net.getConf(Configuration.UI_API_URL, 'token')

      })
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.target = '_blank'
        a.download = `transactions-${periodId}-${accountId}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
      })
    return { preventDefault: true }
  }

  keyIconI() {
    this.props.store.transactions.forEach(tx => {
      if (!tx.open && tx.document.number > 0) {
        tx.toggleOpen()
      }
    })
    return { preventDefault: true }
  }

  keyIconO() {
    this.props.store.transactions.forEach(tx => {
      if (tx.open) {
        tx.toggleOpen()
      }
    })
    return { preventDefault: true }
  }

  keyIconH() {
    const { account, tools } = this.props.store
    const cursor = haveCursor()

    const moveCursor = cursor.inComponent('Balances.transactions')
    if (moveCursor) {
      cursor.leaveComponent()
      cursor.resetSelected()
    }
    runInAction(() => {
      tools.tagDisabled = {}
      account.tags.forEach((tag) => (tools.tagDisabled[tag.tag] = true))
    })
    if (moveCursor) {
      cursor.enterComponent()
    }
    return { preventDefault: true }
  }

  keyIconS() {
    const { tools } = this.props.store
    const cursor = haveCursor()
    const moveCursor = cursor.inComponent('Balances.transactions')
    if (moveCursor) {
      cursor.leaveComponent()
      cursor.resetSelected()
    }
    runInAction(() => {
      tools.tagDisabled = {}
    })
    if (moveCursor) {
      cursor.enterComponent()
    }
    return { preventDefault: true }
  }

  render() {
    if (!this.props.store.isLoggedIn()) {
      return ''
    }

    const { account, tools } = this.props.store
    const cursor = haveCursor()

    const toggle = (tag) => {
      const moveCursor = cursor.inComponent('Balances.transactions')
      if (moveCursor) {
        cursor.leaveComponent()
        cursor.resetSelected()
      }
      runInAction(() => {
        tools.tagDisabled[tag] = !tools.tagDisabled[tag]
      })
      if (moveCursor) {
        cursor.enterComponent()
      }
    }

    const hasTags = account && account.tags && account.tags.length > 0
    const canAddEntry = cursor.componentX > 0 && this.props.store.period && !this.props.store.period.locked && cursor.row !== null
    const canAddTx = this.props.store.period && !this.props.store.period.locked && cursor.row === null
    const canDeleteEntry = cursor.componentX > 0 && cursor.index !== null && cursor.row !== null
    const canDeleteTx = cursor.componentX > 0 && cursor.index !== null && cursor.row === null
    const canDownload = !!this.props.store.accountId
    let last = null

    return (
      <div className="TransactionToolPanel">
        <Title>{account ? account.toString() : <Trans>No account selected</Trans>}</Title>

        <div>
          <IconButton id="Zoom In" shortcut="I" pressKey="IconI" title="show-details" icon="zoom-in" />
          <IconButton id="Zoom Out" shortcut="O" pressKey="IconO" title="hide-details" icon="zoom-out" />
          <IconButton id="Show All" shortcut="S" pressKey="IconS" disabled={!hasTags} title="show-all" icon="show-all" />
          <IconButton id="Hide All" shortcut="H" pressKey="IconH" disabled={!hasTags} title="hide-all" icon="hide-all" />
          <IconButton id="Download" shortcut="D" pressKey="IconD" disabled={!canDownload} title="download-csv" icon="download" />
          <IconButton id="Add Transaction" shortcut="A" disabled={!canAddTx} pressKey="IconA" title="add-tx" icon="add-tx" />
          <IconButton id="Add Row" shortcut="A" disabled={!canAddEntry} pressKey="IconA" title="add-entry" icon="add-entry" />
          <IconButton id="Delete Transaction" shortcut="X" disabled={!canDeleteTx} pressKey="IconX" title="delete-tx" icon="delete-tx" />
          <IconButton id="Delete Row" shortcut="X" disabled={!canDeleteEntry} pressKey="IconX" title="delete-entry" icon="delete-entry" />
        </div>

        <div style={{ marginBottom: '1rem', marginLeft: '1rem', marginRight: '1rem' }}>
          {hasTags && account.tags.map((tag, idx) => {
            const needSpacer = (idx > 0 && tag.type !== last)
            last = tag.type
            return (
              <React.Fragment key={tag.tag}>
                {needSpacer && <div style={{ marginTop: '5px' }}/>}
                <TagChip onClick={() => toggle(tag.tag)} disabled={!!tools.tagDisabled[tag.tag]} tag={tag}/>
              </React.Fragment>
            )
          })}
        </div>
      </div>
    )
  }
}

TransactionToolPanel.propTypes = {
  store: PropTypes.instanceOf(Store)
}

export default TransactionToolPanel
